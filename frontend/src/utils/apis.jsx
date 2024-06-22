import axios from 'axios';

axios.defaults.withCredentials = true;
const dev_env = import.meta.env.VITE_DEV_ENV;
const API_URL =
  dev_env === 'development'
    ? 'http://localhost:4000'
    : 'https://laundrix-api.vercel.app';

const login = (credentials) => {
  return axios.post(`${API_URL}/login`, credentials);
};

const forgotPassword = (email) => {
  return axios.post(`${API_URL}/forgot-password`, { email });
};
const signup = (credentials) => {
  return axios.post(`${API_URL}/signup`, credentials);
};

const logout = () => {
  return axios.get(`${API_URL}/logout`);
};

const updateUserDetails = (changedData) => {
  return axios.patch('http://localhost:4000/user', changedData);
};
const fetchNotifs = () => {
  return axios.get(`${API_URL}/notifications`);
};
const postNotif = (notification) => {
  return axios.post(`${API_URL}/notifications`, notification);
};
const deleteNotif = (id) => {
  return axios.delete(`${API_URL}/notifications/${id}`);
};

const fetchLaunderers = () => {
  return axios.get(`${API_URL}/launderers`);
};

const getStudentOrders = () => {
  return axios.get(`${API_URL}/student/orders`);
};

const getAllOrders = () => {
  return axios.get(`${API_URL}/allorders`);
};
const createOrder = (order) => {
  return axios.post(`${API_URL}/student/createorder`, order);
};
const deleteOrder = (order_id) => {
  return axios.delete(`${API_URL}/student/deleteorder/${order_id}`);
};

const makePayment = (body) => {
  return axios.post(`${API_URL}/payment`, body);
};

const updatePickupStatus = (order_id) => {
  return axios.put(`${API_URL}/student/updatepickupstatus/${order_id}`);
};
const updateAcceptedStatus = (order_id) => {
  return axios.put(`${API_URL}/acceptorder/${order_id}`);
};
const updateDeliveryStatus = (order_id) => {
  return axios.put(`${API_URL}/updatedeliveredstatus/${order_id}`);
};
export {
  login,
  forgotPassword,
  signup,
  logout,
  updateUserDetails,
  deleteNotif,
  fetchNotifs,
  fetchLaunderers,
  postNotif,
  createOrder,
  getStudentOrders,
  getAllOrders,
  makePayment,
  updatePickupStatus,
  deleteOrder,
  updateAcceptedStatus,
  updateDeliveryStatus,
};
