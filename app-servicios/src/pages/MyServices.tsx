import { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
  IonIcon, IonText, IonLoading, IonToggle,
} from '@ionic/react';
import {
  trashOutline, addCircleOutline, hammerOutline, pricetagOutline,
  cashOutline, constructOutline, listOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';
import { isPositiveNumber } from '../lib/validation';
import './MyServices.css';

interface Category {
  id: number;
  name: string;
}

interface ServiceRow {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  is_active: boolean;
  category_id: number;
}

const MyServices: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('servicio');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const titleInvalid = touched && title.trim().length === 0;
  const categoryInvalid = touched && !categoryId;
  const priceInvalid = touched && !isPositiveNumber(price);
  const fieldClass = (invalid: boolean) => `app-field${invalid ? ' app-field--invalid' : ''}`;

  const loadServices = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('services')
      .select('id, title, price, price_unit, is_active, category_id')
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    setServices(data ?? []);
  };

  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data, error }) => {
      if (error) {
        setError(getFriendlyErrorMessage(error));
        return;
      }
      setCategories(data ?? []);
    });
    loadServices();
  }, [user]);

  const handleAdd = async () => {
    setTouched(true);

    if (!user) return;
    if (title.trim().length === 0) {
      setError('Ingresá el título del servicio.');
      return;
    }
    if (!categoryId) {
      setError('Elegí una categoría.');
      return;
    }
    if (!isPositiveNumber(price)) {
      setError('Ingresá un precio mayor a cero.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.from('services').insert({
      professional_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      price: Number(price),
      price_unit: priceUnit,
    });

    setLoading(false);

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }

    setTitle('');
    setPrice('');
    setTouched(false);
    loadServices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    loadServices();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('services').update({ is_active: !current }).eq('id', id);
    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    loadServices();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Mis servicios</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <p className="app-section-label">
          <IonIcon icon={addCircleOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Nuevo servicio
        </p>

        <div className="app-card myservices-form">
          <IonItem className={fieldClass(titleInvalid)} lines="none">
            <IonIcon icon={hammerOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Título del servicio *</IonLabel>
            <IonInput
              value={title}
              onIonInput={(e) => setTitle(e.detail.value!)}
              placeholder="Ej. Instalación eléctrica residencial"
            />
          </IonItem>
          <IonItem className={fieldClass(categoryInvalid)} lines="none">
            <IonIcon icon={constructOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Categoría *</IonLabel>
            <IonSelect value={categoryId} onIonChange={(e) => setCategoryId(e.detail.value)}>
              {categories.map((c) => (
                <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem className={fieldClass(priceInvalid)} lines="none">
            <IonIcon icon={cashOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Precio (Q) *</IonLabel>
            <IonInput type="number" min="0.01" step="0.01" value={price} onIonInput={(e) => setPrice(e.detail.value!)} />
          </IonItem>
          <IonItem className="app-field" lines="none">
            <IonIcon icon={pricetagOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Unidad</IonLabel>
            <IonSelect value={priceUnit} onIonChange={(e) => setPriceUnit(e.detail.value)}>
              <IonSelectOption value="servicio">Por servicio</IonSelectOption>
              <IonSelectOption value="hora">Por hora</IonSelectOption>
              <IonSelectOption value="dia">Por día</IonSelectOption>
              <IonSelectOption value="m2">Por m²</IonSelectOption>
            </IonSelect>
          </IonItem>

          {error && <IonText color="danger"><p className="ion-padding-horizontal">{error}</p></IonText>}

          <IonButton expand="block" color="secondary" className="ion-margin-top" onClick={handleAdd}>
            <IonIcon icon={addCircleOutline} slot="start" />
            Agregar servicio
          </IonButton>
        </div>

        <p className="app-section-label">
          <IonIcon icon={listOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Tus servicios publicados
        </p>

        <div className="myservices-list">
          {services.map((s) => (
            <div key={s.id} className="app-card myservices-item">
              <div className="myservices-item__body">
                <p className="myservices-item__title">
                  <IonIcon icon={hammerOutline} />
                  {s.title}
                </p>
                <span className="app-price">Q{s.price} / {s.price_unit}</span>
              </div>
              <div className="myservices-item__actions">
                <IonToggle
                  checked={s.is_active}
                  onIonChange={() => handleToggleActive(s.id, s.is_active)}
                />
                <IonButton fill="clear" color="danger" onClick={() => handleDelete(s.id)}>
                  <IonIcon icon={trashOutline} slot="icon-only" />
                </IonButton>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="app-empty">
              <IonIcon icon={constructOutline} />
              <h3>Todavía no publicaste servicios</h3>
              <p>Agregá el primero con el formulario de arriba.</p>
            </div>
          )}
        </div>

        <IonLoading isOpen={loading} message="Guardando..." />
      </IonContent>
    </IonPage>
  );
};

export default MyServices;
