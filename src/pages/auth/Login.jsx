import { Link } from "react-router-dom";
import { useState } from "react";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setError("");
    console.log("سيتم إرسال بيانات الدخول إلى الخادم لاحقًا.");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          تسجيل الدخول
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          سجّل دخولك للوصول إلى نظام إدارة النزاعات الصحية.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              البريد الإلكتروني
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              كلمة المرور
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            دخول
          </button>
                <div className="space-y-3 pt-2 text-center text-sm">

        <p className="text-slate-600">
          ليس لديك حساب؟
        </p>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link
            to="/register/patient"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            تسجيل مريض
          </Link>

          <a href="#register-doctor" className="font-medium text-blue-600 hover:text-blue-700">
            تسجيل طبيب
          </a>

          <a href="#register-ngo" className="font-medium text-blue-600 hover:text-blue-700">
            تسجيل مؤسسة
          </a>
        </div>
</div>
        </form>
      </section>
    </main>
  );
}

export default Login;