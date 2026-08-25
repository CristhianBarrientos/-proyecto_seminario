import { useEffect, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonItem, IonLabel, IonTextarea, IonInput, IonButton, IonLoading, IonText, IonNote,
  IonList, IonIcon,
} from '@ionic/react';
import { documentTextOutline, trashOutline, cloudUploadOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';

interface VerificationDoc {
  path: string;
  name: string;
}

const EditProfessionalProfile: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('10');
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('professional_profiles')
      .select('bio, service_radius_km, verification_docs')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    if (data) {
      setBio(data.bio ?? '');
      setRadius(String(data.service_radius_km ?? 10));
      setDocs((data.verification_docs as VerificationDoc[]) ?? []);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const payload: Record<string, unknown> = {
      profile_id: user.id,
      bio,
      service_radius_km: Number(radius),
    };

    // Formato EWKT: "SRID=4326;POINT(longitud latitud)" - longitud primero
    if (lat && lng) {
      payload.location = `SRID=4326;POINT(${lng} ${lat})`;
    }

    const { error } = await supabase
      .from('professional_profiles')
      .upsert(payload, { onConflict: 'profile_id' });

    setLoading(false);

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }

    setSuccess(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError('');

    const path = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(getFriendlyErrorMessage(uploadError));
      return;
    }

    const newDocs = [...docs, { path, name: file.name }];

    const { error: updateError } = await supabase
      .from('professional_profiles')
      .upsert({ profile_id: user.id, verification_docs: newDocs }, { onConflict: 'profile_id' });

    setUploading(false);

    if (updateError) {
      setError(getFriendlyErrorMessage(updateError));
      return;
    }

    setDocs(newDocs);
  };

  const handleDeleteDoc = async (doc: VerificationDoc) => {
    if (!user) return;

    await supabase.storage.from('verification-docs').remove([doc.path]);

    const newDocs = docs.filter((d) => d.path !== doc.path);

    const { error } = await supabase
      .from('professional_profiles')
      .upsert({ profile_id: user.id, verification_docs: newDocs }, { onConflict: 'profile_id' });

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }

    setDocs(newDocs);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Perfil profesional</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Sobre ti / tu experiencia</IonLabel>
          <IonTextarea value={bio} onIonInput={(e) => setBio(e.detail.value!)} autoGrow />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Latitud</IonLabel>
          <IonInput type="number" value={lat} onIonInput={(e) => setLat(e.detail.value!)} placeholder="ej. 14.6349" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Longitud</IonLabel>
          <IonInput type="number" value={lng} onIonInput={(e) => setLng(e.detail.value!)} placeholder="ej. -90.5231" />
        </IonItem>
        <IonNote className="ion-padding-start">
          Tip: en Google Maps, clic derecho sobre tu ubicación → copia las coordenadas.
        </IonNote>

        <IonItem>
          <IonLabel position="stacked">Radio de servicio (km)</IonLabel>
          <IonInput type="number" value={radius} onIonInput={(e) => setRadius(e.detail.value!)} />
        </IonItem>

        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {success && <IonText color="success"><p>Perfil guardado correctamente.</p></IonText>}

        <IonButton expand="block" className="ion-margin-top" onClick={handleSave}>
          Guardar
        </IonButton>

        <IonItem className="ion-margin-top" lines="none">
          <IonLabel>
            <h2>Documentos de verificación</h2>
            <p>Sube tu DPI, licencia o certificación para obtener el sello "Verificado".</p>
          </IonLabel>
        </IonItem>

        <IonList>
          {docs.map((doc) => (
            <IonItem key={doc.path}>
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>{doc.name}</IonLabel>
              <IonButton slot="end" fill="clear" color="danger" onClick={() => handleDeleteDoc(doc)}>
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        <IonButton
          expand="block"
          fill="outline"
          className="ion-margin-top"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <IonIcon icon={cloudUploadOutline} slot="start" />
          {uploading ? 'Subiendo...' : 'Subir documento'}
        </IonButton>

        <IonLoading isOpen={loading} message="Guardando..." />
      </IonContent>
    </IonPage>
  );
};

export default EditProfessionalProfile;