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
import { Database } from "lib/database.types";
import { uploadFileAsFormData } from "@/utils/file";

type FormValues = {
  description: string;
  visibility: "private" | "public";
  file?: File | null;
  imageCompressionType: ImageCompressionType;
};

type ImageCompressionType = "raw" | "client" | "vercel" | "supabase";

export function AddImageForm(props: PaperProps) {
  const supabaseClient = useSupabaseClient();
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isCompressing, setIsCompresing] = useState(false);
  const user = useUser();

  const form = useForm<FormValues>({
    initialValues: {
      description: "",
      visibility: "private",
      file: null,
      imageCompressionType: "client",
    },
  });

  if (!user) return null;

  const addPrefixToFilename = () => {
    if (!(form.values.file instanceof File))
      throw new Error("File is not a File");

    if (!form.values.file?.name) throw new Error("File name is not defined");
    const prefix = `compressed_${Date.now()}_${user?.id}`;
    const prefixedFilename = `${prefix}_${form.values.file?.name}`;

    return prefixedFilename;
  };

  const addPrefixToFilenameWithoutCompresion = () => {
    if (!(form.values.file instanceof File))
      throw new Error("File is not a File");

    if (!form.values.file?.name) throw new Error("File name is not defined");
    const prefix = `${Date.now()}_${user?.id}`;
    const prefixedFilename = `${prefix}_${form.values.file?.name}`;

    return prefixedFilename;
  };

  const addImageWithoutCompression = async () => {
    const prefixedFilename = addPrefixToFilenameWithoutCompresion();
    const filePath = prefixedFilename;

    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, form.values.file as File);
    if (uploadError) throw uploadError;

    // Save the image to the database.
    const { error: insertError } = await supabaseClient.from("images").insert({
      created_by: user.id,
      description: form.values.description,
      filepath: filePath,
      is_public: form.values.visibility === "public",
    });

    if (insertError) throw insertError;
  };

  const addImageWithClientSideCompression = async () => {
    if (!form.values?.file) throw new Error("File is not defined");

    new Compressor(form.values.file as File, {
      quality: 0.6,
      async success(compressedImage) {
        if (!form.values?.file) throw new Error("Failed to add image.");

        try {
          const prefixedFilename = addPrefixToFilename();
          const filePath = prefixedFilename;

          const { error: uploadError } = await supabaseClient.storage
            .from("avatars")
            .upload(filePath, compressedImage);
          if (uploadError) throw uploadError;

          // Save the image to the database.
          const { error: insertError } = await supabaseClient
            .from("images")
            .insert({
              created_by: user.id,
              description: form.values.description,
              filepath: filePath,
              is_public: form.values.visibility === "public",
            });

          if (insertError) throw insertError;
        } catch (error) {
          console.error(error);
          showNotificationError("Failed to add image");
        }
      },
      error(error) {
        throw error;
      },
    });
  };

  const addImageWithVercelSideCompression = async () => {
    if (!form.values?.file) throw new Error("No file");

    // Send file to Vercel Serverless Function for upload with compression.
    const response = await uploadFileAsFormData(
      form.values.file,
      "/api/utils/uploads"
    );
    console.log("response from vercel upload", JSON.stringify(response.data));
  };

  const addImageWithSupabaseSideCompression = async () => {
    const { data, error } = await supabaseClient.functions.invoke("uploads", {
      body: JSON.stringify({ name: "Choy" }),
    });
    if (error) console.error(error);

    console.log("response from supabase upload", JSON.stringify(data));
  };

  const handleAddImageWithFile = async () => {
    try {
      // To disable the form while adding image.
      setIsAddingImage(true);

      // To display a notification while saving to the database.
      showNotification({
        id: "adding-image-notification",
        disallowClose: true,
        autoClose: false,
        title: "Adding image",
        message: "Please wait while we add your image",
        loading: true,
      });

      // Add image to database depending on the image compression type.
      switch (form.values.imageCompressionType) {
        case "raw":
          await addImageWithoutCompression();
          break;
        case "client":
          await addImageWithClientSideCompression();
          break;
        case "vercel":
          await addImageWithVercelSideCompression();
          break;
        case "supabase":
          await addImageWithSupabaseSideCompression();
          break;
        default:
          throw new Error("Invalid iamge compression type.");
      }

      showNotification({
        id: "adding-image-notification-success",
        autoClose: 5000,
        icon: <IconCheck />,
        title: "Success",
        message: "Image added",
      });

      form.reset();

      logApiCall(supabaseClient, {
        api_name: "Client RPC: add_image",
        called_by: user.id,
      });
    } catch (error) {
      console.error(error);
      showNotificationError("Failed to add image");
    } finally {
      hideNotification("adding-image-notification");
      setIsAddingImage(false);
    }
  };

  const handleAddImageWithoutFile = async () => {
    try {
      // To disable the form while adding image.
      setIsAddingImage(true);

      // To display a notification while saving to the database.
      showNotification({
        id: "adding-image-notification",
        disallowClose: true,
        autoClose: false,
        title: "Adding image",
        message: "Please wait while we add your image",
        loading: true,
      });

      // Add image to database without image.
      // Save the image to the database.
      const { error: insertError } = await supabaseClient
        .from("images")
        .insert({
          created_by: user.id,
          description: form.values.description,
          is_public: form.values.visibility === "public",
        });

      if (insertError) throw insertError;

      showNotification({
        id: "adding-image-notification-success",
        autoClose: 5000,
        icon: <IconCheck />,
        title: "Success",
        message: "Image added",
      });

      form.reset();

      logApiCall(supabaseClient, {
        api_name: "add_image",
        called_by: user.id,
      });
    } catch (error) {
      console.error(error);
      showNotificationError("Failed to add image");
    } finally {
      hideNotification("adding-image-notification");
      setIsAddingImage(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      showNotificationError("Max file size is 5mb");
      form.setFieldValue("file", null);
      // setFile(null);
      return;
    }
    form.setFieldValue("file", file);
  };

  return (
    <Paper radius="md" p="xl" withBorder {...props}>
      <Divider label="Add to my image list" labelPosition="center" my="lg" />
      <form
        onSubmit={form.onSubmit((values) => {
          values?.file ? handleAddImageWithFile() : handleAddImageWithoutFile();
        })}
      >
        <Stack>
          <TextInput
            label="Description"
            placeholder="description"
            value={form.values.description}
            onChange={(event) =>
              form.setFieldValue("description", event.currentTarget.value)
            }
            error={form.errors.description && "Invalid description"}
          />
          <Select
            label="Visibility"
            placeholder="Set visibility to private so only you can see this image"
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
            value={form.values.file}
            onChange={handleFileChange}
            disabled={isAddingImage || isCompressing}
          />
        </Stack>
        <Select
          label="Image Compression"
          placeholder="Compress image on Client side, Vercel Serverless Functions or Supabase Edge Functions."
          value={form.values.imageCompressionType}
          data={[
            { value: "raw", label: "No compression" },
            { value: "client", label: "Client Side" },
            { value: "vercel", label: "Vercel Serverless Function" },
            { value: "supabase", label: "Supabase Edge Function" },
          ]}
          onChange={(value) =>
            form.setFieldValue(
              "imageCompressionType",
              value as ImageCompressionType
            )
          }
        />
        <Button disabled={isAddingImage || isCompressing} type="submit">
          {upperFirst("add image")}
        </Button>
      </form>
    </Paper>
  );
}
