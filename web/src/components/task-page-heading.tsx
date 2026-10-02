import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type TaskPageHeadingProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  testCampus?: boolean;
  demo?: boolean;
};

export function TaskPageHeading({ title, children, actions, testCampus, demo }: TaskPageHeadingProps) {
  return (
    <header className="task-page-heading">
      <div className="task-page-title-row">
        <h1>{title}</h1>
        {actions}
      </div>
      <div className="task-page-context">
        <details className="task-page-information">
          <summary>Información <ChevronDown aria-hidden="true" size={15} /></summary>
          <div className="task-page-information-content">{children}</div>
        </details>
        {testCampus ? <p className="task-page-test-note" role="note">Campus de prueba · Usa datos ficticios</p> : null}
        {demo ? <p className="task-page-test-note" role="note">Demostración · No se guarda</p> : null}
      </div>
    </header>
  );
}
