import { showNotification } from "@mantine/notifications";

export const showNotificationError = (title: string, message?: string) => {
  showNotification({
    title,
    message,
    styles: (theme) => ({
      root: {
        "&::before": { backgroundColor: theme.colors.red },
      },
    }),
  });
};

export const showNotificationInfo = (title: string, message?: string) => {
  showNotification({
    title,
    message,
    styles: (theme) => ({
      root: {
        "&::before": { backgroundColor: theme.colors.blue },
      },
    }),
  });
};
