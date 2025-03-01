import {AxiosResponse} from "axios"

export const handleResponse = (response: AxiosResponse) => {
    if (response.status !== 200) {
      throw new Error(response.data.message || "Something went wrong");
    }
    return response.data;
  };

