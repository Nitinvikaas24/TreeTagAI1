import axios from 'axios';
import FormData from 'form-data';

export async function identifyPlant(imageBuffer) {
  const form = new FormData();
  form.append('images', imageBuffer, { filename: 'plant.jpg' });

  const response = await axios.post(
    `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}`,
    form,
    { headers: form.getHeaders() }
  );

  return response.data;
}
