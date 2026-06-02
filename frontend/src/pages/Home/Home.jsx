import './Home.css';
import HeaderCard from "../../components/Home/HeaderCard/HeaderCard.jsx";
import SocialCard from "../../components/Home/SocialCard/SocialCard.jsx";

export default function Home() {
    return (
        <div className="home-container">
            <HeaderCard />
            <SocialCard />
        </div>
    );
}