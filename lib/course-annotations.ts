import "server-only";

import { randomUUID } from "node:crypto";
import { MongoClient, ObjectId, type Collection } from "mongodb";
import type {
  AdminCourseThread,
  CourseMessageSender,
  CourseThreadMessage,
  PrivateCourseAnnotationThread
} from "@/lib/course-messages-shared";
import type { CourseMessagingUser } from "@/lib/course-messages";

type StoredAnnotationMessage = {
  id: string;
  sender: CourseMessageSender;
  body: string;
  createdAt: Date;
};

type CourseAnnotationDocument = {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  pageSlug: string;
  pageTitle: string;
  sectionId: string;
  sectionHeading: string;
  blockId: string;
  quote?: string | null;
  context: string;
  messages: StoredAnnotationMessage[];
  studentReadAt?: Date;
  adminReadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseAnnotationTarget = {
  pageTitle: string;
  sectionId: string;
  sectionHeading: string;
  blockId: string;
  context: string;
  quote: string | null;
};

const globalForCourseAnnotations = globalThis as typeof globalThis & {
  courseAnnotationsMongoClient?: MongoClient;
  courseAnnotationsIndexPromise?: Promise<void>;
};

function getCourseAnnotationsCollection(): Collection<CourseAnnotationDocument> {
  const uri = process.env.MONGODB_URL?.trim();

  if (!uri) throw new Error("Course database is not configured.");

  const client = globalForCourseAnnotations.courseAnnotationsMongoClient ?? new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });
  globalForCourseAnnotations.courseAnnotationsMongoClient = client;

  return client
    .db(process.env.MONGODB_DB || "tomzaragoza")
    .collection<CourseAnnotationDocument>("x_ads_course_annotations");
}

async function ensureCourseAnnotationIndexes(collection: Collection<CourseAnnotationDocument>) {
  if (!globalForCourseAnnotations.courseAnnotationsIndexPromise) {
    globalForCourseAnnotations.courseAnnotationsIndexPromise = (async () => {
      await collection.createIndex({ userId: 1, pageSlug: 1, updatedAt: -1 });
      await collection.createIndex({ updatedAt: -1 });
    })();
  }

  try {
    await globalForCourseAnnotations.courseAnnotationsIndexPromise;
  } catch (error) {
    globalForCourseAnnotations.courseAnnotationsIndexPromise = undefined;
    throw error;
  }
}

function serializeMessage(message: StoredAnnotationMessage): CourseThreadMessage {
  return { ...message, createdAt: message.createdAt.toISOString() };
}

function isUnreadForStudent(document: CourseAnnotationDocument) {
  const lastMessage = document.messages.at(-1);
  return Boolean(
    lastMessage?.sender === "tom" &&
    (!document.studentReadAt || lastMessage.createdAt > document.studentReadAt)
  );
}

function isUnreadForAdmin(document: CourseAnnotationDocument) {
  const lastMessage = document.messages.at(-1);
  return Boolean(
    lastMessage?.sender === "student" &&
    (!document.adminReadAt || lastMessage.createdAt > document.adminReadAt)
  );
}

function serializePrivateAnnotation(
  document: CourseAnnotationDocument & { _id: ObjectId },
  user: CourseMessagingUser
): PrivateCourseAnnotationThread {
  return {
    id: document._id.toHexString(),
    unread: isUnreadForStudent(document),
    source: "annotation",
    pageSlug: document.pageSlug,
    pageTitle: document.pageTitle,
    sectionId: document.sectionId,
    sectionHeading: document.sectionHeading,
    blockId: document.blockId,
    quote: document.quote ?? null,
    context: document.context,
    participant: { name: user.name, image: user.image },
    messages: document.messages.map(serializeMessage),
    updatedAt: document.updatedAt.toISOString()
  };
}

function serializeAdminAnnotation(
  document: CourseAnnotationDocument & { _id: ObjectId }
): AdminCourseThread {
  return {
    id: document._id.toHexString(),
    unread: isUnreadForAdmin(document),
    source: "annotation",
    userName: document.userName,
    userEmail: document.userEmail,
    userImage: document.userImage ?? null,
    participant: {
      name: document.userName,
      image: document.userImage ?? null
    },
    pageSlug: document.pageSlug,
    pageTitle: document.pageTitle,
    sectionId: document.sectionId,
    sectionHeading: document.sectionHeading,
    context: document.context,
    blockId: document.blockId,
    quote: document.quote ?? null,
    messages: document.messages.map(serializeMessage),
    updatedAt: document.updatedAt.toISOString()
  };
}

export async function getPrivateCourseAnnotations(
  user: CourseMessagingUser,
  pageSlug?: string
) {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const documents = await collection
    .find({ userId: user.id, ...(pageSlug ? { pageSlug } : {}) })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();
  return documents.map((document) => serializePrivateAnnotation(document, user));
}

export async function countPrivateCourseAnnotations(userId: string) {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  return collection.countDocuments({ userId });
}

export async function countAllCourseAnnotations() {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  return collection.countDocuments();
}

export async function countPrivateUnreadCourseAnnotations(userId: string) {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const documents = await collection.find({ userId }).toArray();
  return documents.filter(isUnreadForStudent).length;
}

export async function countAllUnreadCourseAnnotations() {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const documents = await collection.find().toArray();
  return documents.filter(isUnreadForAdmin).length;
}

export async function markStudentCourseAnnotationRead(
  user: CourseMessagingUser,
  threadId: string
) {
  if (!ObjectId.isValid(threadId)) throw new Error("Unknown course conversation.");
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(threadId), userId: user.id },
    { $set: { studentReadAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Unknown course conversation.");
  return serializePrivateAnnotation(result, user);
}

export async function markAdminCourseAnnotationRead(threadId: string) {
  if (!ObjectId.isValid(threadId)) throw new Error("Unknown course conversation.");
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(threadId) },
    { $set: { adminReadAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Unknown course conversation.");
  return serializeAdminAnnotation(result);
}

export async function createCourseAnnotation(input: {
  user: CourseMessagingUser;
  target: CourseAnnotationTarget;
  pageSlug: string;
  body: string;
}) {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const now = new Date();
  const document: CourseAnnotationDocument = {
    userId: input.user.id,
    userName: input.user.name,
    userEmail: input.user.email,
    userImage: input.user.image,
    pageSlug: input.pageSlug,
    pageTitle: input.target.pageTitle,
    sectionId: input.target.sectionId,
    sectionHeading: input.target.sectionHeading,
    blockId: input.target.blockId,
    quote: input.target.quote,
    context: input.target.context,
    messages: [{
      id: randomUUID(),
      sender: "student",
      body: input.body,
      createdAt: now
    }],
    studentReadAt: now,
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(document);
  return serializePrivateAnnotation({ ...document, _id: result.insertedId }, input.user);
}

export async function addStudentCourseAnnotationReply(input: {
  user: CourseMessagingUser;
  threadId: string;
  body: string;
}) {
  if (!ObjectId.isValid(input.threadId)) throw new Error("Unknown course conversation.");

  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const now = new Date();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(input.threadId), userId: input.user.id },
    {
      $set: {
        userName: input.user.name,
        userEmail: input.user.email,
        userImage: input.user.image,
        studentReadAt: now,
        updatedAt: now
      },
      $push: {
        messages: {
          $each: [{
            id: randomUUID(),
            sender: "student" as const,
            body: input.body,
            createdAt: now
          }],
          $slice: -200
        }
      }
    },
    { returnDocument: "after" }
  );

  if (!result) throw new Error("Unknown course conversation.");
  return serializePrivateAnnotation(result, input.user);
}

export async function deleteFirstCourseAnnotationMessage(input: {
  user: CourseMessagingUser;
  threadId: string;
}) {
  if (!ObjectId.isValid(input.threadId)) throw new Error("Unknown course conversation.");

  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const _id = new ObjectId(input.threadId);
  const document = await collection.findOne({ _id, userId: input.user.id });

  if (!document || document.messages[0]?.sender !== "student") {
    throw new Error("Unknown course comment.");
  }

  if (document.messages.length === 1) {
    const deleted = await collection.deleteOne({
      _id,
      userId: input.user.id,
      "messages.0.id": document.messages[0].id,
      "messages.1": { $exists: false }
    });

    if (deleted.deletedCount === 1) {
      return { deleted: true as const, threadId: input.threadId };
    }
  }

  const result = await collection.findOneAndUpdate(
    {
      _id,
      userId: input.user.id,
      "messages.0.id": document.messages[0].id
    },
    {
      $set: { studentReadAt: new Date(), updatedAt: new Date() },
      $pop: { messages: -1 }
    },
    { returnDocument: "after" }
  );

  if (!result) throw new Error("The comment changed before it could be deleted.");
  return {
    deleted: false as const,
    thread: serializePrivateAnnotation(result, input.user)
  };
}

export async function getAdminCourseAnnotationThreads() {
  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const documents = await collection.find().sort({ updatedAt: -1 }).limit(200).toArray();
  return documents.map(serializeAdminAnnotation);
}

export async function addAdminCourseAnnotationReply(threadId: string, body: string) {
  if (!ObjectId.isValid(threadId)) throw new Error("Unknown course conversation.");

  const collection = getCourseAnnotationsCollection();
  await ensureCourseAnnotationIndexes(collection);
  const now = new Date();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(threadId) },
    {
      $set: { adminReadAt: now, updatedAt: now },
      $push: {
        messages: {
          $each: [{
            id: randomUUID(),
            sender: "tom" as const,
            body,
            createdAt: now
          }],
          $slice: -200
        }
      }
    },
    { returnDocument: "after" }
  );

  if (!result) throw new Error("Unknown course conversation.");
  return serializeAdminAnnotation(result);
}
