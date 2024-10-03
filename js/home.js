// Update cart count when a product is added to the cart
const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const projectId = "ecommerce-43f8f";
const baseUrlCarts = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/carts`;


let cartCount = 0;
let currentUserId = localStorage.getItem('loggedInUserId'); // Replace with actual user ID fetching logic
let cart = [];

// Function to update the cart count on the UI
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    cartCountElement.textContent = cartCount;
}

async function fetchUserCart() {
    if (!currentUserId) return [];

    try {
        const response = await fetch(`${baseUrlCarts}?key=${apiKey}`);
        const data = await response.json();

        if (data.documents) {
            // Filter cart items to only show those that belong to the current user
            return data.documents
                .map(doc => doc.fields)
                .filter(item => item.userId.stringValue === currentUserId);
        }

        return [];
    } catch (error) {
        console.error('Error fetching cart items:', error);
        return [];
    }
}

// Function to add a product to the cart
async function addToCart(productId) {
    if (!currentUserId) {
        alert("Please log in to add items to your cart.");
        return;
    }

    const documentId = `${currentUserId}_${productId}`; // Create a unique document ID
    try {
        // Check if the product is already in the user's cart
        const cartItemRef = `${baseUrlCarts}/${documentId}?key=${apiKey}`;
        const existingCartItem = await fetch(cartItemRef);

        // If the response status is 404, it means the item is not in the cart, so create a new document
        if (existingCartItem.status === 404) {
            const productRef = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${productId}?key=${apiKey}`;
            const productResponse = await fetch(productRef);
            const productData = await productResponse.json();

            if (productData.fields) {
                const cartItemData = {
                    userId: currentUserId,
                    productId: productId,
                    quantity: 1,
                    name: productData.fields.Title.stringValue,
                    price: productData.fields.Price.doubleValue,
                    description: productData.fields.Description.stringValue,
                    imageUrl: productData.fields.ImageURL.stringValue,
                };

                // Store the cart item in Firestore under the carts collection
                await fetch(`${baseUrlCarts}/${documentId}?key=${apiKey}`, {
                    method: "PATCH", // Use PATCH to create or update the document
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: {
                            userId: { stringValue: currentUserId },
                            productId: { stringValue: productId },
                            quantity: { integerValue: 1 },
                            name: { stringValue: cartItemData.name },
                            price: { doubleValue: cartItemData.price },
                            description: { stringValue: cartItemData.description },
                            imageUrl: { stringValue: cartItemData.imageUrl }
                        }
                    })
                });

                // Update cart button to indicate the item was added
                const button = document.querySelector(`button[onclick="addToCart('${productId}')"]`);
                button.textContent = "Added to Cart";
                button.disabled = true; // Disable the button after adding
            }
        } else {
            // If the item already exists in the cart, alert the user
            alert("Item is already in your cart!");
        }
    } catch (error) {
        console.error('Error adding item to cart:', error);
    }
}

// Function to fetch products and display them
async function fetchProducts() {
    try {
        const response = await fetch(`${baseUrlProducts}?key=${apiKey}`);
        const data = await response.json();

        // Fetch the user's cart to disable "Add to Cart" buttons for already added items
        cart = await fetchUserCart();
        displayProducts(data.documents);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const productShowcase = document.getElementById('product-showcase');
    const categorySelect = document.getElementById('category-select');
    let cartCount = 0;
    let cart = []; // To track cart items

    // Fetch products from Firestore
    async function fetchProducts() {
        const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
        const projectId = "ecommerce-43f8f";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}`;

        try {
            const response = await fetch(firestoreUrl);
            const data = await response.json();
            return data.documents; // Return the products for further use
        } catch (error) {
            console.error("Error fetching products:", error);
            return []; // Return an empty array on error
        }
    }

    // Fetch categories from Firestore
    async function fetchCategories() {
        const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
        const projectId = "ecommerce-43f8f";
        const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/Category?key=${apiKey}`;

        try {
            const response = await fetch(baseFirestoreUrl);
            const data = await response.json();

            // Clear existing options
            categorySelect.innerHTML = '<option value="">Select Category</option>';

            // Iterate over the categories and create option elements
            data.documents.forEach(doc => {
                const categoryName = doc.fields.Name.stringValue; // Adjust based on your Firestore document structure
                const categoryId = doc.name.split('/').pop(); // Get the document ID (CatID)

                const option = document.createElement('option');
                option.value = categoryId; // Use CatID
                option.textContent = categoryName;

                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }

    // Display products in the product showcase
    async function displayProducts(products) {
        productShowcase.innerHTML = ""; // Clear existing products

        products.forEach(product => {
            const productData = product.fields;
            const productId = product.name.split('/').pop(); // Get product ID from Firestore document name
            const isInCart = cart.some(item => item.productId === productId); // Check if item is already in the cart

            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <div class="product-image">
                    <img src="${productData.ImageURL.stringValue}" alt="${productData.Title.stringValue}">
                </div>
                <div class="product-details">
                    <h3>${productData.Title.stringValue}</h3>
                    <p>${productData.Description.stringValue}</p>
                    <p>$${productData.Price.doubleValue.toFixed(2)}</p>
                    <button class="add-to-cart" onclick="addToCart('${productId}')" ${isInCart ? 'disabled' : ''}>
                        ${isInCart ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                </div>
            `;
            productShowcase.appendChild(productElement);
        });

        // Update the add to cart buttons after products are loaded
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function () {
                cartCount += 1;
                updateCartCount();
            });
        });
    }

    // Handle search functionality
    async function handleSearch() {
        const query = document.getElementById('search-bar').value.toLowerCase();
        const category = categorySelect.value;

        const products = await fetchProducts(); // Fetch products again
        const filteredProducts = products.filter(doc => {
            const productTitle = doc.fields.Title.stringValue.toLowerCase();
            const productCategory = doc.fields.CatID.stringValue; // Assuming your product has a category field

            const matchesTitle = query ? productTitle.includes(query) : true; // Check if title matches if query is provided
            const matchesCategory = category ? productCategory === category : true; // Check if category matches if category is selected

            return matchesTitle && matchesCategory; // Return true if both conditions are satisfied
        });

        displayProducts(filteredProducts); // Display filtered products
    }

    // Initialize the app by fetching products and categories
    async function initialize() {
        const products = await fetchProducts();
        displayProducts(products);
        fetchCategories();
    }

    // Initialize the app
    initialize();

    document.getElementById('search-btn').addEventListener('click', handleSearch);

    // Handle profile icon click (for future implementation)
    document.getElementById('profile-icon').addEventListener('click', function () {
        alert('Redirecting to profile page...');
        // Implement redirect to profile page
    });

    // Handle cart icon click (for future implementation)
    document.getElementById('cart-icon').addEventListener('click', function () {
        alert('Redirecting to cart page...');
        // Implement redirect to cart page
    });
});
