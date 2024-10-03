// Firebase configuration
const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; 
const PROJECT_ID = "ecommerce-43f8f";  
const COLLECTION_ID = "carts"; 

document.addEventListener('DOMContentLoaded', () => {
    fetchCartItems();
    document.getElementById('place-order-button').addEventListener('click', placeOrder);
});

async function fetchCartItems() {
    const userId = localStorage.getItem('loggedInUserId');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}?key=${API_KEY}`;
    const cartItemsBody = document.getElementById('cart-items-body'); // Assuming you have this element
    const totalPriceElement = document.getElementById('total-price'); // Assuming you have this element
    let totalAmount = 0;
    let cartData = []; // Initialize an array to store cart items

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.documents) {
            cartData = data.documents
                .filter(doc => doc.name.includes(userId)) // Ensure we only get items for the logged-in user
                .map(doc => ({
                    id: doc.name.split('/').pop(),
                    name: doc.fields.name.stringValue,
                    price: parseFloat(doc.fields.price.doubleValue),
                    quantity: parseInt(doc.fields.quantity.integerValue),
                    description: doc.fields.description.stringValue, // Added description
                    imageUrl: doc.fields.imageUrl.stringValue // Added imageUrl
                }));

            if (cartData.length > 0) {
                displayCartItems(cartData);
            } else {
                cartItemsBody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
            }
        } else {
            cartItemsBody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching cart items:', error);
        cartItemsBody.innerHTML = '<tr><td colspan="4">Error fetching cart items.</td></tr>';
    }
    return cartData; // Return the cart data
}

function displayCartItems(items) {
    const cartItemsBody = document.getElementById('cart-items-body'); // Assuming you have this element
    const totalPriceElement = document.getElementById('total-price'); // Assuming you have this element
    cartItemsBody.innerHTML = '';  
    let totalAmount = 0;

    items.forEach((item) => {
        const cartRow = document.createElement('tr');
        cartRow.innerHTML = `
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td class="quantity-buttons">
                <span class="quantity">${item.quantity}</span>
            </td>
            <td>$<span class="subtotal">${(item.price * item.quantity).toFixed(2)}</span></td>
        `;
        cartItemsBody.appendChild(cartRow);
        totalAmount += item.price * item.quantity;
    });

    totalPriceElement.textContent = totalAmount.toFixed(2);
}

async function clearCartForUser(userId) {
    const cartUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}?key=${API_KEY}`;

    try {
        const response = await fetch(cartUrl);
        const data = await response.json();

        if (data.documents) {
            const userCartItems = data.documents
                .filter(doc => doc.name.includes(userId))
                .map(doc => doc.name); // 'doc.name' contains the document path

            // Delete each cart item for the user
            const deletePromises = userCartItems.map(itemUrl => {
                const apiUrl = `https://firestore.googleapis.com/v1/${itemUrl}?key=${API_KEY}`;
                return fetch(apiUrl, {
                    method: 'DELETE',
                });
            });

            // Wait for all cart items to be deleted
            await Promise.all(deletePromises);
            console.log(`Cart cleared for user: ${userId}`);
        }
    } catch (error) {
        console.error("Error clearing cart:", error);
        alert("There was an error clearing your cart. Please try again.");
    }
}


async function placeOrder() {
    const address = document.getElementById('address').value.trim();
    const coupon = document.getElementById('coupon').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    if (!address) {
        alert("Please enter your shipping address.");
        return;
    }

    const userId = localStorage.getItem('loggedInUserId');
    const orderId = Date.now().toString(); // Unique order ID as string
    const date = new Date().toISOString();

    // Fetch cart items to get current data
    const cartItems = await fetchCartItems(); // Ensure this function returns an array of cart items

    if (!cartItems || cartItems.length === 0) {
        alert("Your cart is empty. Please add items to the cart before placing an order.");
        return;
    }

    // Prepare order object
    const orderData = {
        fields: {
            userId: { stringValue: userId },
            orderId: { stringValue: orderId },
            date: { stringValue: date },
            address: { stringValue: address },
            coupon: { stringValue: coupon || "" }, // Store as empty string if coupon is not provided
            paymentMethod: { stringValue: paymentMethod },
            items: {
                arrayValue: {
                    values: cartItems.map(item => ({
                        mapValue: {
                            fields: {
                                name: { stringValue: item.name },
                                price: { doubleValue: item.price },
                                quantity: { integerValue: item.quantity },
                                description: { stringValue: item.description || "" }, // Provide a default value if description is undefined
                                imageUrl: { stringValue: item.imageUrl || "" }, // Provide a default value if imageUrl is undefined
                                productId: { stringValue: item.id },
                            },
                        },
                    })),
                },
            },
        },
    };

    // Log the orderData to see what is being sent
    console.log("Order Data:", JSON.stringify(orderData, null, 2));

    const ordersRef = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders?key=${API_KEY}`;

    try {
        const response = await fetch(ordersRef, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (response.ok) {
            alert("Order placed successfully!");
            await clearCartForUser(userId); 
            console.log(userId);
            window.location.href = 'home.html'; 
        } else {
            // Log the response for debugging
            const errorResponse = await response.json();
            console.error("Error response from Firestore:", errorResponse);
            alert(`Error placing order: ${errorResponse.error.message}`);
            throw new Error("Failed to place order.");
        }
    } catch (error) {
        console.error("Error placing order:", error);
        alert("There was an error placing your order. Please try again.");
    }
}


function goBack() {
    window.history.back();
}
