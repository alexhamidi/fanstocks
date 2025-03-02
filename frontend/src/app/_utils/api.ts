import { isAxiosError } from "axios";

export const requestWrapper = async (
  errorMessage: string,
  triggerError: ((message: string) => void) | null,
  successMessage: string,
  triggerSuccess: ((message: string) => void) | null,
  setLoading: ((loading: boolean) => void) | null,
  statusMessages: { [key: number]: string }, // Proper type for statusMessages mapping
  apiCall: (...params: any[]) => Promise<any>,
  ...params: any[] // Rest parameter must be last
) => {
  if (setLoading) setLoading(true);
  try {
    return await apiCall(...params);
  } catch (err) {
    let message = errorMessage;
    if (isAxiosError(err)) {
      if (err.status! in statusMessages) {
        message = statusMessages[err.status!];
      } else {
        message = err.message;
      }
    }
    if (triggerError) triggerError(errorMessage);
    if (triggerSuccess) triggerSuccess(successMessage);
  } finally {
    if (setLoading) setLoading(false);
  }
};
