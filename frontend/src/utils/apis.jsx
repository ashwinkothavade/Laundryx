import axios from 'axios';

axios.defaults.withCredentials = true;

// The auth cookie lasts 24 hours and the SPA has no idea when it lapses, so
// an expired session used to surface as every panel on the page failing
// separately. Catch it once, here: clear the client's idea of who is logged
// in and send them to the login screen with a reason.
//
// Only for 401 (no/!invalid session). A 403 is a real authorization refusal —
// the user IS logged in and simply may not do that — so it must not log them
// out.
let redirecting = false;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const onLoginScreen = /\/(login|signup)$/.test(window.location.pathname);

    if (status === 401 && !onLoginScreen && !redirecting) {
      redirecting = true;
      try {
        sessionStorage.removeItem('auth-store');
      } catch (e) {
        // private mode / blocked storage — the redirect still matters
      }
      window.location.assign('/login?expired=1');
    }
    return Promise.reject(error);
  }
);

// Prefer an explicit VITE_API_URL; fall back to the legacy VITE_DEV_ENV switch
// so existing deployments keep working. Exported so other modules use one URL.
const dev_env = import.meta.env.VITE_DEV_ENV;
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (dev_env === 'development'
    ? 'http://localhost:4000'
    : 'https://laundrix-api.vercel.app');

const login = (credentials) => {
  return axios.post(`${API_URL}/login`, credentials);
};

const getMe = () => {
  return axios.get(`${API_URL}/me`);
};

const validatePayment = (body) => {
  return axios.put(`${API_URL}/payment/validate`, body);
};

const forgotPassword = (email) => {
  return axios.post(`${API_URL}/forgotpassword`, { email });
};
const signup = (credentials) => {
  return axios.post(`${API_URL}/signup`, credentials);
};

const logout = () => {
  return axios.get(`${API_URL}/logout`);
};

const updateUserDetails = (changedData) => {
  return axios.patch(`${API_URL}/user`, changedData);
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

const fetchLaundererDirectory = () => {
  return axios.get(`${API_URL}/launderers/directory`);
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
const rescheduleOrder = (order_id, changes) => {
  return axios.put(`${API_URL}/student/reschedule/${order_id}`, changes);
};
const cancelOrder = (order_id) => {
  return axios.put(`${API_URL}/student/cancelorder/${order_id}`);
};
const setLaundererAvailability = (timeSlots) => {
  return axios.put(`${API_URL}/launderer/availability`, { timeSlots });
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

// ---- Launderer analytics ----
const getLaundererAnalytics = () => axios.get(`${API_URL}/launderer/analytics`);

// ---- Catalog (per-launderer clothing/wash/price) ----
const getMyCatalog = () => axios.get(`${API_URL}/catalog/my`);
const getLaundererCatalog = (username) =>
  axios.get(`${API_URL}/catalog/launderer/${username}`);
const addCatalogItem = (item) => axios.post(`${API_URL}/catalog`, item);
const updateCatalogItem = (id, item) =>
  axios.put(`${API_URL}/catalog/${id}`, item);
const deleteCatalogItem = (id) => axios.delete(`${API_URL}/catalog/${id}`);

// ---- Dynamic settings (locations, time slots, ...) ----
const getSettings = () => axios.get(`${API_URL}/settings`);
const upsertSetting = (key, values) =>
  axios.put(`${API_URL}/settings/${key}`, { values });
const addSettingValue = (key, value) =>
  axios.post(`${API_URL}/settings/${key}`, { value });
const removeSettingValue = (key, value) =>
  axios.delete(`${API_URL}/settings/${key}/${encodeURIComponent(value)}`);

// ---- Coupons & express ----
const previewCoupon = (code, subtotal) =>
  axios.get(`${API_URL}/coupons/${encodeURIComponent(code)}`, {
    params: { subtotal },
  });
const setLaundererExpress = (expressSurcharge) =>
  axios.put(`${API_URL}/launderer/express`, { expressSurcharge });
const adminCreateCoupon = (body) =>
  axios.post(`${API_URL}/admin/coupons`, body);
const adminListCoupons = () => axios.get(`${API_URL}/admin/coupons`);
const adminDeleteCoupon = (id) =>
  axios.delete(`${API_URL}/admin/coupons/${id}`);

// ---- Reviews & ratings ----
const createReview = (body) => axios.post(`${API_URL}/reviews`, body);
const getLaundererReviews = (username) =>
  axios.get(`${API_URL}/reviews/launderer/${username}`);
const getReviewsSummary = () => axios.get(`${API_URL}/reviews/summary`);

// ---- Admin ----
const adminGetUsers = () => axios.get(`${API_URL}/admin/users`);
const adminDeleteUser = (id) => axios.delete(`${API_URL}/admin/users/${id}`);
const adminUpdateUserRole = (id, role) =>
  axios.patch(`${API_URL}/admin/users/${id}/role`, { role });
const adminSetApproval = (id, approved) =>
  axios.patch(`${API_URL}/admin/users/${id}/approval`, { approved });
const adminGetOrders = () => axios.get(`${API_URL}/admin/orders`);
const adminGetCatalog = () => axios.get(`${API_URL}/admin/catalog`);
const adminGetAnalytics = () => axios.get(`${API_URL}/admin/analytics`);

export {
  login,
  getMe,
  validatePayment,
  forgotPassword,
  signup,
  logout,
  updateUserDetails,
  deleteNotif,
  fetchNotifs,
  fetchLaunderers,
  postNotif,
  fetchLaundererDirectory,
  createOrder,
  getStudentOrders,
  getAllOrders,
  makePayment,
  updatePickupStatus,
  deleteOrder,
  rescheduleOrder,
  cancelOrder,
  setLaundererAvailability,
  updateAcceptedStatus,
  updateDeliveryStatus,
  getLaundererAnalytics,
  getMyCatalog,
  getLaundererCatalog,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getSettings,
  upsertSetting,
  addSettingValue,
  removeSettingValue,
  previewCoupon,
  setLaundererExpress,
  adminCreateCoupon,
  adminListCoupons,
  adminDeleteCoupon,
  createReview,
  getLaundererReviews,
  getReviewsSummary,
  adminGetUsers,
  adminDeleteUser,
  adminUpdateUserRole,
  adminSetApproval,
  adminGetOrders,
  adminGetCatalog,
  adminGetAnalytics,
};
