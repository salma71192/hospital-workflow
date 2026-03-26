const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post("login/", { username, password }, { withCredentials: true });
    setUser(res.data); // important for App.jsx
  } catch (err) {
    alert("Login failed");
  }
};