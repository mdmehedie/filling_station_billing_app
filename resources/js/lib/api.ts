import axios from 'axios';

export const orderList = async (fn: Function, params?: Object) => {
    const response = await axios.get('/api/orders', { params });
    fn(response.data);
}; 