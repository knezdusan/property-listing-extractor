export default function FormSignUp() {
  return (
    <form action="">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          title="must be a valid email address"
          pattern="[A-Za-z0-9._+-]+@[A-Za-z0-9 -]+\.[a-z]{2,}"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          title="Must be at least 8 characters"
          pattern="[a-zA-Z0-9]{8,}"
          required
        />
        <p className="input-hint">Must be at least 8 characters</p>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
