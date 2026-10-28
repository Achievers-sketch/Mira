import { Alert } from "@/components/ui/Alert";

export function SetupNotice() {
  return (
    <Alert tone="warning" title="Accounts are not set up yet">
      This site is not connected to its user database yet, so sign-in and registration are switched
      off. Nothing you type here would be saved.
    </Alert>
  );
}
