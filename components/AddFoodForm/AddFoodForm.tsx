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
  name: string;
  description: string;
  rating: number;
  visibility: "private" | "public";
  file?: File | null;
  imageCompressionType: ImageCompressionType;
};

type ImageCompressionType = "raw" | "client" | "vercel" | "supabase";

export function AddFoodForm(props: PaperProps) {
  const supabaseClient = useSupabaseClient();
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isCompressing, setIsCompresing] = useState(false);
  const user = useUser();

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      description: "",
      rating: 2,
      visibility: "private",
      file: null,
      imageCompressionType: "client",
    },
    validate: {
      name: (value) =>
        value.length < 2 && value.length <= 20
          ? "Name must be at least 2 and max 20 characters long "
          : null,
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

  const addFoodWithoutCompression = async () => {
    // Save food to database.
    const prefixedFilename = addPrefixToFilename();
    const filePath = prefixedFilename;

    // ???? I just need to make sure the error here is handled.
    // I'll handle it inside here na lang rin.
    // Upload the compressed image to Supabase storage.
    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, form.values.file as File);
    if (uploadError) throw uploadError;

    // Save the food to the database.
    const { error: insertError } = await supabaseClient.from("foods").insert({
      user_id: user.id,
      name: form.values.name,
      description: form.values.description,
      rating: form.values.rating,
      image_url: filePath,
      is_public: form.values.visibility === "public",
    });

    if (insertError) throw insertError;
  };

  const addFoodWithClientSideCompression = async () => {
    if (!form.values?.file) throw new Error("File is not defined");

    // ???? Another thing, how do i await for new Compressor()?
    new Compressor(form.values.file as File, {
      quality: 0.6,
      async success(compressedImage) {
        if (!form.values?.file) throw new Error("Failed to add food.");

        try {
          // Save food to database.
          const prefixedFilename = addPrefixToFilename();
          const filePath = prefixedFilename;

          // ???? I just need to make sure the error here is handled.
          // I'll handle it inside here na lang rin.
          // Upload the compressed image to Supabase storage.
          const { error: uploadError } = await supabaseClient.storage
            .from("avatars")
            .upload(filePath, compressedImage);
          if (uploadError) throw uploadError;

          // console.log("return data from upload", JSON.stringify(data));
          //????
          // {"path":"compressed_1667112688185_390cd28d-6e1d-4fab-bb49-9427f3923f52_pexels-ash-376464.jpg"}

          // Save the food to the database.
          const { error: insertError } = await supabaseClient
            .from("foods")
            .insert({
              user_id: user.id,
              name: form.values.name,
              description: form.values.description,
              rating: form.values.rating,
              image_url: filePath,
              is_public: form.values.visibility === "public",
            });

          if (insertError) throw insertError;
        } catch (error) {
          console.error(error);
          showNotificationError("Failed to add food");
        }
      },
      error(error) {
        throw error;
      },
    });
  };

  const addFoodWithVercelSideCompression = async () => {
    // Send form as axios form data reqesut to /api/utils/uploads
    // should i do client side then jsu t send the file for compressed upload to vercel or not/
    // there should be one function for saving food to db and 1 function with 3 implem for uploading image with or without compression.
    // ???? for now, let's do this above.
    if (!form.values?.file) throw new Error("No file");

    // Send file to Vercel Serverless Function for upload with compression.
    const response = await uploadFileAsFormData(
      form.values.file,
      "/api/utils/uploads"
    );
    console.log("response from vercel upload", JSON.stringify(response.data));
  };

  const addFoodWithSupabaseSideCompression = async () => {
    const { data, error } = await supabaseClient.functions.invoke("uploads", {
      body: JSON.stringify({ name: "Choy" }),
    });
    if (error) console.error(error);

    console.log("response from supabase upload", JSON.stringify(data));
  };

  const handleAddFoodWithFile = async () => {
    try {
      // To disable the form while adding food.
      setIsAddingFood(true);

      // To display a notification while saving to the database.
      showNotification({
        id: "adding-food-notification",
        disallowClose: true,
        autoClose: false,
        title: "Adding food",
        message: "Please wait while we add your food",
        loading: true,
      });

      // Add food to database depending on the image compression type.
      switch (form.values.imageCompressionType) {
        case "raw":
          await addFoodWithoutCompression();
          break;
        case "client":
          await addFoodWithClientSideCompression();
          break;
        case "vercel":
          await addFoodWithVercelSideCompression();
          break;
        case "supabase":
          await addFoodWithSupabaseSideCompression();
          break;
        default:
          throw new Error("Invalid iamge compression type.");
      }

      showNotification({
        id: "adding-food-notification-success",
        autoClose: 5000,
        icon: <IconCheck />,
        title: "Success",
        message: "Food added",
      });

      form.reset();

      logApiCall(supabaseClient, {
        api_name: "add_food",
        called_by: user.id,
      });
    } catch (error) {
      console.error(error);
      showNotificationError("Failed to add food");
    } finally {
      hideNotification("adding-food-notification");
      setIsAddingFood(false);
    }
  };

  const handleAddFoodWithoutFile = async () => {
    try {
      // To disable the form while adding food.
      setIsAddingFood(true);

      // To display a notification while saving to the database.
      showNotification({
        id: "adding-food-notification",
        disallowClose: true,
        autoClose: false,
        title: "Adding food",
        message: "Please wait while we add your food",
        loading: true,
      });

      // Add food to database without image.
      // Save the food to the database.
      const { error: insertError } = await supabaseClient.from("foods").insert({
        user_id: user.id,
        name: form.values.name,
        description: form.values.description,
        rating: form.values.rating,
        is_public: form.values.visibility === "public",
      });

      if (insertError) throw insertError;

      showNotification({
        id: "adding-food-notification-success",
        autoClose: 5000,
        icon: <IconCheck />,
        title: "Success",
        message: "Food added",
      });

      form.reset();

      logApiCall(supabaseClient, {
        api_name: "add_food",
        called_by: user.id,
      });
    } catch (error) {
      console.error(error);
      showNotificationError("Failed to add food");
    } finally {
      hideNotification("adding-food-notification");
      setIsAddingFood(false);
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
      <Divider label="Add to my food list" labelPosition="center" my="lg" />
      <form
        onSubmit={form.onSubmit((values) => {
          values?.file ? handleAddFoodWithFile() : handleAddFoodWithoutFile();
        })}
      >
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
            {...form.getInputProps("name")}
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
            value={form.values.file}
            onChange={handleFileChange}
            disabled={isAddingFood || isCompressing}
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
        <Button disabled={isAddingFood || isCompressing} type="submit">
          {upperFirst("add food")}
        </Button>
      </form>
    </Paper>
  );
}
