// import { get, post } from "./RestClient";
import axios from 'axios';

export const getUserId = async (): Promise<any> => {
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/user/auth`;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authorization token not found');
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.result;
  } catch (error) {
    console.error('Error in fetching user details', error);
    throw error;
  }
};
