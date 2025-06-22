import Link from "next/link";
import styles from './register.module.css'
export default function RegisterPage() {
    return (
        <div id = {styles.background} className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-green-700">Create an Account</h2>
                <form className="space-y-5">
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="name">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                    >
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-green-600 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}