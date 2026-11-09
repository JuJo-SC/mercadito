import type { ReactNode } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { DismissibleDetails } from "@/components/dismissible-details";

type TaskPageHeadingProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  testCampus?: boolean;
  demo?: boolean;
};

export function TaskPageHeading({ title, description, children, actions, testCampus, demo }: TaskPageHeadingProps) {
  return (
    <header className="task-page-heading">
      <div className="task-page-title-row">
        <div>
          <h1>{title}</h1>
          {description ? <p className="task-page-description">{description}</p> : null}
        </div>
        <div className="task-page-tools">
          {actions}
          <DismissibleDetails className="task-page-information">
            <summary aria-label={"Información sobre " + title}>
              <span className="task-information-label">Información</span>
              <ChevronDown className="task-information-chevron" aria-hidden="true" size={15} />
              <CircleHelp className="task-information-mobile-icon" aria-hidden="true" size={19} />
            </summary>
            <div className="task-page-information-content">{children}</div>
          </DismissibleDetails>
        </div>
      </div>
      {testCampus || demo ? (
        <div className="task-page-context">
          {testCampus ? <p className="task-page-test-note" role="note">Campus de prueba · Usa datos ficticios</p> : null}
          {demo ? <p className="task-page-test-note" role="note">Demostración · No se guarda</p> : null}
        </div>
      ) : null}
    </header>
  );
}
