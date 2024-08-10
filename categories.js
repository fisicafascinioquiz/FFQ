import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Carregar categorias
export async function loadCategories(contentDiv, firestore) {
    contentDiv.innerHTML = '<h2>Início</h2><p>Carregando categorias...</p>';
    try {
        const querySnapshot = await getDocs(collection(firestore, "categories"));
        if (querySnapshot.empty) {
            contentDiv.innerHTML = '<h2>Início</h2><p>Nenhuma categoria encontrada.</p>';
        } else {
            let html = '<h2></h2><div class="categories">';
            querySnapshot.forEach(doc => {
                const category = doc.data();
                html += `<div class="category-card" onclick="selectCategory('${doc.id}')">
            <img src="${category.categoryImage}" alt="${category.categoryName}">
            <h3>${category.categoryName}</h3>
         </div>`;
            });
            html += '</div>';
            contentDiv.innerHTML = html;
        }
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        contentDiv.innerHTML = '<h2>Início</h2><p>Erro ao carregar categorias.</p>';
    }
}

// Carregar subcategorias
export async function loadSubcategories(contentDiv, firestore, categoryId, userId) {
    contentDiv.innerHTML = '<h2>Temas</h2><p>Carregando temas...</p>';
    try {
        const userDocRef = doc(firestore, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            throw new Error("Usuário não encontrado");
        }

        const userData = userDoc.data();
        const needsAdaptedActivities = userData.needsAdaptedActivities;

        const subcategoriesRef = collection(firestore, `categories/${categoryId}/subcategories`);
        const querySnapshot = await getDocs(subcategoriesRef);

        if (querySnapshot.empty) {
            contentDiv.innerHTML = '<h2>Temas</h2><p>Nenhum tema encontrado.</p>';
        } else {
            let html = `<h2>Temas</h2><div class="categories">`;
            querySnapshot.forEach(subDoc => {
                const subcategory = subDoc.data();
                if (subcategory.isAdapted === needsAdaptedActivities) {
                    html += `<div class="category-card" onclick="selectSubcategory('${categoryId}', '${subDoc.id}')">
            <img src="${subcategory.subcategoryImage}" alt="${subcategory.subcategoryName}">
            <h3>${subcategory.subcategoryName}</h3>
         </div>`;
                }
            });
            html += '</div>';
            contentDiv.innerHTML = html;
        }
    } catch (error) {
        console.error("Erro ao carregar subcategorias:", error);
        contentDiv.innerHTML = '<h2>Subcategorias</h2><p>Erro ao carregar subcategorias.</p>';
    }
}

// Redirecionar para quiz.html com os parâmetros categoryId e subcategoryId
window.selectSubcategory = function(categoryId, subcategoryId) {
    // Redireciona para quiz.html com os parâmetros na URL
    window.location.href = `quiz.html?categoryId=${categoryId}&subcategoryId=${subcategoryId}`;
};
