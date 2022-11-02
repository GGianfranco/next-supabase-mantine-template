import axios from "axios";

export const uploadFileAsFormData = async (
  file: File,
  endpoint: string,
  directory = ""
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", directory);
  const response = await axios.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
};
