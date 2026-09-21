import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon } from '@ionic/react';
import { hourglassOutline } from 'ionicons/icons';

const Bookings: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="app-title">Mis solicitudes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="app-empty" style={{ paddingTop: 72 }}>
          <IonIcon icon={hourglassOutline} />
          <h3>Todavía no está listo</h3>
          <p>
            Acá vas a poder ver el estado de tus solicitudes de servicio
            (solicitado, aceptado, completado). Es la Fase 5 del roadmap.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Bookings;
