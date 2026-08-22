import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonText } from '@ionic/react';

const Bookings: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mis solicitudes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText color="medium">
          <p>
            Aquí vas a poder ver el estado de tus solicitudes de servicio
            (solicitado, aceptado, completado). Todavía no está construido —
            es la Fase 5 del roadmap.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Bookings;
