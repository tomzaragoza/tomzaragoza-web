import { WorkspaceNavigation, type WorkspaceNavigationProps } from "./workspace-navigation";
import styles from "./x-ads.module.css";

export function CourseSidebar(props: WorkspaceNavigationProps) {
  return (
    <aside className={styles.sidebar} aria-label="Workspace sidebar">
      <div className={styles.sidebarInner}><WorkspaceNavigation {...props} /></div>
    </aside>
  );
}
