import './Profile.css';
import HeaderCard from "../../components/Profile/HeaderCard/HeaderCard.jsx";
import StatsCard from "../../components/Profile/StatsCard/StatsCard.jsx";

export default function Profile() {
    return (
        <div className="profile-container">
            <HeaderCard />
            <StatsCard />
        </div>
    );
}