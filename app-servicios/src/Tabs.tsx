import { Navigate, Route } from 'react-router-dom';
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { compassOutline, clipboardOutline, personCircleOutline } from 'ionicons/icons';
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import EditProfessionalProfile from './pages/EditProfessionalProfile';
import MyServices from './pages/MyServices';
import ProfessionalDetail from './pages/ProfessionalDetail';

const Tabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/home" element={<Home />} />
        <Route path="/tabs/home/:id" element={<ProfessionalDetail />} />
        <Route path="/tabs/bookings" element={<Bookings />} />
        <Route path="/tabs/profile" element={<Profile />} />
        <Route path="/tabs/profile/edit" element={<EditProfessionalProfile />} />
        <Route path="/tabs/profile/services" element={<MyServices />} />
        <Route path="/tabs" element={<Navigate to="/tabs/home" replace />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={compassOutline} />
          <IonLabel>Explorar</IonLabel>
        </IonTabButton>
        <IonTabButton tab="bookings" href="/tabs/bookings">
          <IonIcon icon={clipboardOutline} />
          <IonLabel>Solicitudes</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personCircleOutline} />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default Tabs;