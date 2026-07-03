#  <img src="https://github.com/NightFury742/LaundriX/assets/119070798/5afc3cc0-69c9-45d9-83ff-faafbc888a8d" height="40px"> LaundriX

LaundriX is a laundry booking system designed for our institute hostels, allowing students to book hassle-free laundry appointments through an online platform. This system streamlines the process of getting laundry done, making the experience seamless and efficient. It is designed for both students and launderers, making it a fully online solution for the cause of laundry.
<Br><Br>

# <img src="https://github.com/NightFury742/LaundriX/assets/119070798/ec2ddfa4-c318-4a76-9296-872e8d5fab3f" height="30px"> Features

* **User Authentication:** Sign in using your created account.
* **Service Selection**: Choose from our range of services: Wash & Iron, PowerClean, and DryClean.
* **Item Specification:** Add various clothing items to your order.
* **Convenient Scheduling**: Select your preferred pickup date, launderer, time slot, and location.
* **Secure Payments**: Complete transactions securely with Razorpay.
* **Order Management**: View and review your orders with multiple filter based selections.
* **Notifications**:
     - **Launderers:** Receive notifications about each order placed, and updates about the payment status of the orders of each student.
     - **Students:** Receive notifications about each update concerning placed orders, from your selected launderer, whether it is about                changed delivery date, rejected order, or deivery status.
* **Role-Based Access:**
     - **Students:** Place, check and view laundry orders.
     - **Launderers:** Accept, reject and process laundry orders.
* **Work Flow:**
     - Students add items, select their quantity, and select their wash type.
     - Students select the schedule and select their launderer as per their preference.
     - Once placed, the orders go into the selected launderer's account, waiting for their acceptance.
     - Once accepted, the order can be picked up by the launderer.
     - Once picked up, the launderer processes the order and then delivers to the student as per the schedule.
     - Any changes are reported back to the student through a notification.
     - The student is then required to pay the required amount for the order through an online payment gateway.
     - The payment option is available once the launderer accepts the order.
<Br><Br>

# <img src="https://github.com/NightFury742/LaundriX/assets/119070798/28a131bf-d93f-44a2-b368-7eaa1476685b" height="30px"> Design

[Checkout our Figma design](https://www.figma.com/file/Yq77JsE5rNfOIuwUEYgqtr/Laundrix?type=design&t=q4XGVlCGgkAkNEar-6)
<Br><Br>

# <img src="https://github.com/NightFury742/LaundriX/assets/119070798/6f622e92-9e0d-492c-a901-c5969a1140c0" height="35"> Tech Stack

## Frontend
* React JS
* Chakra UI
* Framer Motion

## Backend
* Express JS
* Mongo DB
* Razorpay
* Json WebToken

<Br><Br>

# <img height="37px" src="https://github.com/NightFury742/LaundriX/assets/119070798/6c1290e3-d35c-4828-8023-ba99194b3991"> Project Initialization
1. Fork this repository.
2. Clone the forked repository locally.
     ```
     git clone https://github.com/<your-username>/LaundriX.git
     cd LaundriX
     ```
3. Backend Setup
     1. Navigate to the backend directory:
     ```
     cd backend
     ```
     2. Install dependencies:
     ```
     npm i
     ```
     3. Start the backend server:
     ```
     npm run server / nodemon 
     ```
     
5. Frontend Setup
     1. Navigate to the frontend directory:
     ```
     cd frontend
     ```
     2. Install dependencies:
     ```
     npm i
     ```
     3. Start the frontend development server:
     ```
     npm run dev
     ```


# 🐳 Run with Docker

The whole stack (MongoDB + Express backend + Vite/nginx frontend) is containerized.

**Prerequisites:** Docker and Docker Compose.

1. Create your environment file from the template and fill in the secrets:
     ```
     cp .env.example .env
     ```
2. Build and start everything:
     ```
     docker compose up --build
     ```
3. Open the app:
     - Frontend: http://localhost:8080
     - Backend API: http://localhost:4000
     - MongoDB: localhost:27017 (data persisted in the `mongo-data` volume)

To run in the background use `docker compose up --build -d`, and `docker compose down` to stop (add `-v` to also remove the database volume).

Notes:
- Leave `MONGO_URI` unset in `.env` to use the bundled MongoDB container, or set it to a MongoDB Atlas URI to use a managed database.
- Keep `NODE_ENV=development` for local http; the auth cookies are marked `Secure` only in production (behind HTTPS).
- The frontend `VITE_*` values are baked in at build time, so re-run `docker compose build frontend` after changing them.


# <img height="40px" src="https://github.com/NightFury742/LaundriX/assets/119070798/143a52c0-b60d-4f57-b38f-3e5156e124d9"> License

MIT License
