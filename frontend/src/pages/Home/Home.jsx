import './Home.css';
import HeaderCard from "../../components/Home/HeaderCard/HeaderCard.jsx";
import SocialCard from "../../components/Home/SocialCard/SocialCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="home-container">
            <HeaderCard />
            {user && <SocialCard />}
        </div>
    );
}