import { IconCheck } from "@tabler/icons";
import { upperFirst } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import {
  TextInput,
  Paper,
  PaperProps,
  Button,
  Divider,
  Stack,
  FileInput,
  Rating,
  Select,
} from "@mantine/core";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { showNotificationError } from "@/utils/notification";
import Compressor from "compressorjs";
import { hideNotification, showNotification } from "@mantine/notifications";
import { MAX_IMAGE_SIZE } from "constants/file";
import { logApiCall } from "@/utils/analytics";

type FormValues = {
  name: string;
  description: string;
  rating: number;
  visibility: "private" | "public";
};

export function AddFoodForm(props: PaperProps) {
  const supabaseClient = useSupabaseClient();
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isCompressing, setIsCompresing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const user = useUser();

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      description: "",
      rating: 2,
      visibility: "private",
    },
  });

  if (!user) return null;

  const handleAddFood = async (values: FormValues) => {
    try {
      setIsAddingFood(true);

      showNotification({
        id: "adding-food-notification",
        disallowClose: true,
        autoClose: false,
        title: "Adding food",
        message: "Please wait while we add your food",
        loading: true,
      });

      let filePath;
      if (file?.name) {
        const prefix = `compressed_${Date.now()}_${user?.id}`;
        filePath = `${prefix}_${file.name}`;

        const { error: uploadError } = await supabaseClient.storage
          .from("avatars")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await supabaseClient.from("foods").insert({
        user_id: user.id,
        name: values.name,
        description: values.description,
        rating: values.rating,
        image_url: filePath,
        is_public: values.visibility === "public",
      });

      // Save to analytics API call here.

      if (insertError) throw insertError;

      showNotification({
        id: "adding-food-notification-success",
        autoClose: 5000,
        icon: <IconCheck />,
        title: "Success",
        message: "Food added",
      });

      setFile(null);
      form.reset();

      logApiCall(supabaseClient, { api_name: "add_food", called_by: user.id });
    } catch {
      showNotificationError("Failed to add food");
    } finally {
      hideNotification("adding-food-notification");
      setIsAddingFood(false);
    }
  };

  const handleSetFile = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      showNotificationError("Max file size is 5mb");
      setFile(null);
      return;
    }

    setIsCompresing(true);
    console.log("File size: ", file.size);

    // Display compressing image loading notification to user.
    showNotification({
      id: "compressing-image-notification",
      onClose: () => {
        showNotification({
          id: "compressing-image-notification-success",
          autoClose: 5000,
          icon: <IconCheck />,
          title: "Success",
          message: "Your image has been compressed successfully.",
        });
      },
      disallowClose: true,
      autoClose: false,
      title: "Compressing image",
      message: "Please wait while we compress your image",
      loading: true,
    });

    // Compress image on add.
    new Compressor(file, {
      quality: 0.6,
      async success(result) {
        // const url = URL.createObjectURL(result);

        setFile(result as File);
        setIsCompresing(false);
        hideNotification("compressing-image-notification");
        console.log("File size compressed: ", result.size);
        console.log(
          "File size reduced by: ",
          Math.round((result.size / file.size) * 100),
          "%"
        );
      },
      error(error) {
        setIsCompresing(false);
        setFile(null);
        showNotificationError(error.message);
        hideNotification("compressing-image-notification");
      },
    });
  };

  return (
    <Paper radius="md" p="xl" withBorder {...props}>
      <Divider label="Add to my food list" labelPosition="center" my="lg" />
      <form onSubmit={form.onSubmit(handleAddFood)}>
        <Stack>
          <TextInput
            required
            label="Name"
            placeholder="name"
            value={form.values.name}
            onChange={(event) =>
              form.setFieldValue("name", event.currentTarget.value)
            }
            error={form.errors.name && "Invalid name"}
          />
          <TextInput
            label="Description"
            placeholder="description"
            value={form.values.description}
            onChange={(event) =>
              form.setFieldValue("description", event.currentTarget.value)
            }
            error={form.errors.description && "Invalid description"}
          />
          <Rating
            value={form.values.rating}
            onChange={(value) => form.setFieldValue("rating", value)}
          />
          <Select
            label="Visibility"
            placeholder="Set visibility to private so only you can see this food"
            value={form.values.visibility}
            data={[
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ]}
            onChange={(value) =>
              form.setFieldValue(
                "visibility",
                (value as FormValues["visibility"]) || "private"
              )
            }
          />
          <FileInput
            label="Upload file"
            placeholder="Upload file"
            accept="image/png,image/jpeg,image/jpg"
            value={file}
            onChange={handleSetFile}
            disabled={isCompressing}
          />
        </Stack>
        <Button disabled={isAddingFood || isCompressing} type="submit">
          {upperFirst("add food")}
        </Button>
      </form>
    </Paper>
  );
}
