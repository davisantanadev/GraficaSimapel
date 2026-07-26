import "@/styles/globals.css";
import type { AppProps } from "next/app";
import '../styles/Login.css';
import '../styles/Homepage.css';
import '@/styles/Dashboard.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
