import React from 'react';
import { useNavigate } from 'react-router-dom';

const DumyPayment = () => {
  const amount = 50000;
  const currency = 'INR';
  const receipt = 'qwsaq1';
  const navigate = useNavigate();

  const handlePayment = async (e) => {
    const response = await fetch('http://localhost:4000/payment', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency,
        receipt,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const order = await response.json();
    console.log(order);

    var options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
      amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency,
      name: 'LaundriX', //your business name
      description: 'Test Transaction',
      image: 'https://example.com/your_logo',
      order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      prefill: {
        //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
        name: 'Vedant Jain', //your customer's name
        email: 'jainvedant392@gmail.com',
        contact: '9644962241', //Provide the customer's phone number for better conversion rates
      },
      handler: async function (response) {
        const body = { ...response };

        const validateResp = await fetch(
          'http://localhost:4000/payment/validate',
          {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const jsonResp = await validateResp.json();
        console.log(jsonResp);

        navigate('/');
        // alert(response.razorpay_payment_id);
        // alert(response.razorpay_order_id);
        // alert(response.razorpay_signature);
      },

      notes: {
        address: 'IIIT Jabalpur',
      },
      theme: {
        color: '#584BAC',
      },
    };
    var rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', function (response) {
      alert(response.error.code);
      alert(response.error.description);
      alert(response.error.source);
      alert(response.error.step);
      alert(response.error.reason);
      alert(response.error.metadata.order_id);
      alert(response.error.metadata.payment_id);
    });
    rzp1.open();
    e.preventDefault();
  };
  return (
    <>
      <div>
        <button
          style={{
            background: 'black',
            color: 'white',
            width: '100px',
            height: '50px',
            margin: '5rem',
            borderRadius: '10px',
          }}
          onClick={handlePayment}
        >
          Pay
        </button>
      </div>
    </>
  );
};

export default DumyPayment;
