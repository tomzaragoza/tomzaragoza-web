import "server-only";

import { randomUUID } from "node:crypto";
import { MongoClient, ObjectId, type Collection } from "mongodb";
import { getGoogleAuth } from "@/lib/google-auth";
import { hasComplimentaryCourseAccess } from "@/lib/course-access-policy";
import { isCourseAdminEmail } from "@/lib/course-admin-policy";
import type {
  AdminCourseThread,
  CourseMessageSender,
  CourseThreadMessage,
  PrivateCourseMessageCenterThread,
  PrivateCourseThread
} from "@/lib/course-messages-shared";

type StoredCourseMessage = {
  id: string;
  sender: CourseMessageSender;
  body: string;
  createdAt: Date;
};

type CourseThreadDocument = {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  pageSlug: string;
  pageTitle: string;
  sectionId: string;
  sectionHeading: string;
  note: string;
  messages: StoredCourseMessage[];
  studentReadAt?: Date;
  adminReadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseMessagingUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

const globalForCourseMessages = globalThis as typeof globalThis & {
  courseMessagesMongoClient?: MongoClient;
  courseMessagesIndexPromise?: Promise<void>;
};

function getCourseMessagesCollection(): Collection<CourseThreadDocument> {
  const uri = process.env.MONGODB_URL?.trim();

  if (!uri) {
    throw new Error("Course database is not configured.");
  }

  const client = globalForCourseMessages.courseMessagesMongoClient ?? new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });
  globalForCourseMessages.courseMessagesMongoClient = client;

  return client
    .db(process.env.MONGODB_DB || "tomzaragoza")
    .collection<CourseThreadDocument>("x_ads_course_threads");
}

async function ensureCourseMessageIndexes(collection: Collection<CourseThreadDocument>) {
  if (!globalForCourseMessages.courseMessagesIndexPromise) {
    globalForCourseMessages.courseMessagesIndexPromise = (async () => {
      await collection.createIndex(
        { userId: 1, pageSlug: 1, sectionId: 1 },
        { unique: true }
      );
      await collection.createIndex({ updatedAt: -1 });
    })();
  }

  try {
    await globalForCourseMessages.courseMessagesIndexPromise;
  } catch (error) {
    globalForCourseMessages.courseMessagesIndexPromise = undefined;
    throw error;
  }
}

function serializeMessage(message: StoredCourseMessage): CourseThreadMessage {
  return {
    ...message,
    createdAt: message.createdAt.toISOString()
  };
}

function serializePrivateThread(
  document: (CourseThreadDocument & { _id: ObjectId }) | null,
  user: CourseMessagingUser
): PrivateCourseThread {
  return {
    id: document?._id.toHexString() ?? null,
    unread: document ? isUnreadForStudent(document) : false,
    participant: {
      name: user.name,
      image: user.image
    },
    messages: document?.messages.map(serializeMessage) ?? []
  };
}

function isUnreadForStudent(document: CourseThreadDocument) {
  const lastMessage = document.messages.at(-1);
  return Boolean(
    lastMessage?.sender === "tom" &&
    (!document.studentReadAt || lastMessage.createdAt > document.studentReadAt)
  );
}

function isUnreadForAdmin(document: CourseThreadDocument) {
  const lastMessage = document.messages.at(-1);
  return Boolean(
    lastMessage?.sender === "student" &&
    (!document.adminReadAt || lastMessage.createdAt > document.adminReadAt)
  );
}

function serializeAdminThread(
  document: CourseThreadDocument & { _id: ObjectId }
): AdminCourseThread {
  return {
    id: document._id.toHexString(),
    unread: isUnreadForAdmin(document),
    source: "note",
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
    context: document.note,
    blockId: null,
    quote: null,
    messages: document.messages.map(serializeMessage),
    updatedAt: document.updatedAt.toISOString()
  };
}

function serializePrivateMessageCenterThread(
  document: CourseThreadDocument & { _id: ObjectId },
  user: CourseMessagingUser
): PrivateCourseMessageCenterThread {
  return {
    id: document._id.toHexString(),
    unread: isUnreadForStudent(document),
    source: "note",
    pageSlug: document.pageSlug,
    pageTitle: document.pageTitle,
    sectionId: document.sectionId,
    sectionHeading: document.sectionHeading,
    blockId: document.sectionId,
    quote: null,
    context: document.note,
    participant: { name: user.name, image: user.image },
    messages: document.messages.map(serializeMessage),
    updatedAt: document.updatedAt.toISOString()
  };
}

export async function getCourseMessagingUser(
  requestHeaders: Headers
): Promise<CourseMessagingUser | null> {
  const auth = getGoogleAuth();
  if (!auth) return null;

  const session = await auth.api.getSession({ headers: requestHeaders }).catch(() => null);
  if (!session?.user.email) return null;

  const hasProAccess = hasComplimentaryCourseAccess(session.user.email) ||
    isCourseAdminEmail(session.user.email);

  if (!hasProAccess) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name?.trim() || "Course customer",
    email: session.user.email.trim().toLowerCase(),
    image: session.user.image?.trim() || null
  };
}

export async function getPrivateCourseThread(
  user: CourseMessagingUser,
  pageSlug: string,
  sectionId: string
) {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const document = await collection.findOne({ userId: user.id, pageSlug, sectionId });
  return serializePrivateThread(document, user);
}

export async function getPrivateCourseMessageThreads(user: CourseMessagingUser) {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const documents = await collection
    .find({ userId: user.id })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();
  return documents.map((document) => serializePrivateMessageCenterThread(document, user));
}

export async function countPrivateCourseMessageThreads(userId: string) {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  return collection.countDocuments({ userId });
}

export async function countAllCourseMessageThreads() {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  return collection.countDocuments();
}

export async function countPrivateUnreadCourseMessageThreads(userId: string) {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const documents = await collection.find({ userId }).toArray();
  return documents.filter(isUnreadForStudent).length;
}

export async function countAllUnreadCourseMessageThreads() {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const documents = await collection.find().toArray();
  return documents.filter(isUnreadForAdmin).length;
}

export async function markStudentCourseThreadRead(
  user: CourseMessagingUser,
  threadId: string
) {
  if (!ObjectId.isValid(threadId)) throw new Error("Unknown course conversation.");
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(threadId), userId: user.id },
    { $set: { studentReadAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Unknown course conversation.");
  return serializePrivateMessageCenterThread(result, user);
}

export async function markAdminCourseThreadRead(threadId: string) {
  if (!ObjectId.isValid(threadId)) throw new Error("Unknown course conversation.");
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(threadId) },
    { $set: { adminReadAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Unknown course conversation.");
  return serializeAdminThread(result);
}

export async function addStudentCourseMessage(input: {
  user: CourseMessagingUser;
  pageSlug: string;
  pageTitle: string;
  sectionId: string;
  sectionHeading: string;
  note: string;
  body: string;
}) {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const now = new Date();
  const message: StoredCourseMessage = {
    id: randomUUID(),
    sender: "student",
    body: input.body,
    createdAt: now
  };

  await collection.updateOne(
    {
      userId: input.user.id,
      pageSlug: input.pageSlug,
      sectionId: input.sectionId
    },
    {
      $set: {
        userName: input.user.name,
        userEmail: input.user.email,
        userImage: input.user.image,
        pageTitle: input.pageTitle,
        sectionHeading: input.sectionHeading,
        note: input.note,
        studentReadAt: now,
        updatedAt: now
      },
      $setOnInsert: {
        userId: input.user.id,
        pageSlug: input.pageSlug,
        sectionId: input.sectionId,
        createdAt: now
      },
      $push: {
        messages: {
          $each: [message],
          $slice: -200
        }
      }
    },
    { upsert: true }
  );

  return getPrivateCourseThread(input.user, input.pageSlug, input.sectionId);
}

export async function getAdminCourseThreads() {
  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const documents = await collection.find().sort({ updatedAt: -1 }).limit(200).toArray();
  return documents.map(serializeAdminThread);
}

export async function addAdminCourseReply(threadId: string, body: string) {
  if (!ObjectId.isValid(threadId)) {
    throw new Error("Unknown course conversation.");
  }

  const collection = getCourseMessagesCollection();
  await ensureCourseMessageIndexes(collection);
  const now = new Date();
  const message: StoredCourseMessage = {
    id: randomUUID(),
    sender: "tom",
    body,
    createdAt: now
  };
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(threadId) },
    {
      $set: { adminReadAt: now, updatedAt: now },
      $push: {
        messages: {
          $each: [message],
          $slice: -200
        }
      }
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Unknown course conversation.");
  }

  return serializeAdminThread(result);
}
