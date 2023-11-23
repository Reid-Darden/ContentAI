$(document).ready(function () {
  $(document).on("click", "h1", () => {
    if (confirm("Go to home page?")) {
      window.location.href = "/";
    }
  });
});
