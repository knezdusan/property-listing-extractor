import { MdErrorOutline, MdOutlineCheckCircle, MdWarningAmber } from "react-icons/md";

type FormNotificationProps = {
  status?: "success" | "warning" | "error";
  children: React.ReactNode;
};

/**
 * A component that displays a form notification with an icon and a message.
 * @param status: "success" | "warning" | "error" - The status of the notification.
 * @param children: React.ReactNode - The message to display.
 * @returns JSX.Element - The form notification component.
 */
export default function FormNotification({ status, children }: FormNotificationProps) {
  let formNotificationIcon = null;

  if (status) {
    switch (status) {
      case "success":
        formNotificationIcon = <MdOutlineCheckCircle />;
        break;
      case "warning":
        formNotificationIcon = <MdWarningAmber />;
        break;
      case "error":
        formNotificationIcon = <MdErrorOutline />;
        break;
    }
  }

  return (
    <div className={`form-group frm-ntf ${status && "frm-ntf-" + status}`}>
      <div className="frm-ntf-icon">{formNotificationIcon}</div>
      <div className="frm-ntf-text">{children}</div>
    </div>
  );
}
