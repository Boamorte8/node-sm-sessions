const deleteProduct = (btn) => {
  const prodId = btn.previousElementSibling.value;
  const productElement = btn.closest('article');

  fetch(`/admin/product/${prodId}`, { method: 'DELETE', headers: {} })
    .then((result) => result.json())
    .then((result) => {
      console.log(productElement);
      productElement.remove();
    })
    .catch((err) => console.error(err));
};
