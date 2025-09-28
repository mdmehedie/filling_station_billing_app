import axios from 'axios';

export const orderList = async (fn: Function, params?: Object) => {
    const response = await axios.get('/api/orders', { params });
    fn(response.data);
}; 

export const getAllVehicles = async (fn: Function, params?: Object) => {
    const response = await axios.get('/api/vehicles', { params });
    fn(response.data);
}; 

export const getAllOrganizations = async (fn: Function, params?: Object) => {
    const response = await axios.get('/api/organizations', { params });
    fn(response.data);
}; 