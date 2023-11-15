import AWS from "aws-sdk";
import exp from "constants";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3({
  region: "us-east-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

export const upload_to_s3 = async (attachment: any) => {
  try {
    const params: any = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: attachment.key,
      Body: attachment.buffer,
      ACL: "public-read",
      ContentType: `image/${attachment.ext}`,
    };

    await s3.upload(params).promise();
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};

export const get_image_from_s3 = async (key: string) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };

    const signedUrl = s3.getSignedUrl("getObject", params);

    return signedUrl;
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};

const validate_file = (file: any) => {
  try {
    const allowed_extensions = ["png", "jpg", "jpeg", "gif"];
    const file_extension = file.originalname.split(".").pop();

    return allowed_extensions.includes(file_extension);
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};

export const parse_image = (file: any) => {
  try {
    if (!file || !validate_file(file)) {
      throw new Error("Please upload a valid image.");
    }

    const image = {
      buffer: file.buffer,
      ext: file.originalname.split(".").pop(),
      key: `${uuidv4()}.${file.originalname.split(".").pop()}`,
    };

    return image;
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};

// parse buffer to image
export const parse_buffer_to_image = async (buffer: any) => {
  try {
    let image_type: string;

    const pngSignature = "89504e47";
    const jpegSignature = "ffd8ffe0";
    const gifSignature = "47494638";

    // Read the first 4 bytes of the buffer and convert them to a hexadecimal string
    const signature = buffer.toString("hex", 0, 4);

    // Check the image type by signature
    switch (signature) {
      case pngSignature:
        image_type = "png";
        break;
      case jpegSignature:
        image_type = "jpeg";
        break;
      case gifSignature:
        image_type = "gif";
        break;
      default:
        throw new Error("Invalid image type.");
    }

    const image = {
      buffer: buffer,
      ext: image_type,
      key: `${uuidv4()}.${image_type}`,
    };

    return image;
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};
