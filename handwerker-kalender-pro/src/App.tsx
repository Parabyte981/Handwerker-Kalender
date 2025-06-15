import { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Edit2, Trash2, Save, X, AlertTriangle, Moon, Sun, Printer, User, Users, Info, Briefcase, Phone, Mail, MapPin } from 'lucide-react';

// Datenstrukturen
interface Customer {
  id: string;
  name: string;
  firma?: string;
  strasseHnr: string;
  plz: string;
  stadt: string;
  telefon: string;
  email?: string;
}

interface Appointment {
  id: string;
  customerId: string;
  customerName?: string; // Denormalisiert für einfachen Zugriff, optional
  date: string;
  time: string;
  task: string;
  duration: number; // in Stunden
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
}

type ViewMode = 'month' | 'week' | 'day';

// Define a type for the keys of the errors object in AppointmentModal
type AppointmentErrorKeys = keyof (Omit<Appointment, 'id' | 'customerName'> & { customerId: string });

const germanMonths = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const germanDays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Beispieldaten (normalerweise von einem Backend geladen)
const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Max Mustermann', firma: 'Muster GmbH', strasseHnr: 'Musterweg 1', plz: '12345', stadt: 'Musterstadt', telefon: '0123-4567890', email: 'max@muster.de' },
  { id: 'c2', name: 'Erika Mustermann', strasseHnr: 'Beispielallee 2a', plz: '54321', stadt: 'Beispielhausen', telefon: '0987-6543210', email: 'erika@beispiel.com' },
  { id: 'c3', name: 'John Doe', firma: 'Doe AG', strasseHnr: 'Ahornstraße 15', plz: '98765', stadt: 'Ahornfeld', telefon: '0111-2233445', email: 'john.doe@doeag.com'},
  { id: 'c4', name: 'Jane Roe', strasseHnr: 'Birkenweg 7', plz: '12321', stadt: 'Birkenhain', telefon: '0222-3344556', email: 'jane.roe@example.net'},
];

const initialAppointments: Appointment[] = [
  { id: 'a1', customerId: 'c1', date: '2024-06-10', time: '10:00', task: 'Heizungswartung', duration: 2, isRecurring: false },
  { id: 'a2', customerId: 'c2', date: '2024-06-10', time: '14:00', task: 'Sanitärinstallation', duration: 3, isRecurring: false },
  { id: 'a3', customerId: 'c1', date: '2024-06-12', time: '09:00', task: 'Reparatur Wasserhahn', duration: 1, isRecurring: false },
  { id: 'a4', customerId: 'c3', date: '2024-06-14', time: '11:00', task: 'Klimaanlagen-Check', duration: 2.5, isRecurring: false},
  { id: 'a5', customerId: 'c2', date: '2024-07-01', time: '08:30', task: 'Badplanung Besprechung', duration: 1.5, isRecurring: false},
  { id: 'a6', customerId: 'c4', date: '2024-06-20', time: '13:00', task: 'Dachrinnenreinigung', duration: 2, isRecurring: true, recurringType: 'monthly', recurringEndDate: '2025-12-31'},
  { id: 'a7', customerId: 'c1', date: '2024-01-15', time: '10:00', task: 'Jährliche Wartung (Test)', duration: 2, isRecurring: true, recurringType: 'yearly'},
];


// Haupt-App-Komponente
const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('appointments');
    if (saved) {
        const parsedAppointments = JSON.parse(saved);
        // Stellen Sie sicher, dass customerName für jeden Termin gesetzt ist
        return parsedAppointments.map((app: Appointment) => ({
            ...app,
            customerName: customers.find(c => c.id === app.customerId)?.name || 'Unbekannter Kunde'
        }));
    }
    // Für initialAppointments customerName hinzufügen
    return initialAppointments.map(app => ({
        ...app,
        customerName: customers.find(c => c.id === app.customerId)?.name || 'Unbekannter Kunde'
    }));
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Effekte für LocalStorage Speicherung
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments.map(({customerName, ...rest}) => rest))); // customerName nicht speichern
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
    // Update customerName in appointments if customers change
    setAppointments(prevAppointments => prevAppointments.map(app => ({
        ...app,
        customerName: customers.find(c => c.id === app.customerId)?.name || 'Unbekannter Kunde'
    })));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Berechnungen für Kalenderansicht
  const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);

  // Navigation
  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setViewMode('day');
    setSelectedDate(today);
  };

  // Klick-Handler
  const handleDateClick = (day: number | Date) => {
    const date = typeof day === 'number' ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : day;
    setSelectedDate(date);
    setViewMode('day');
  };

  const openModalForDate = (date: Date) => {
    setSelectedDate(date);
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (appointment: Appointment) => {
    setSelectedDate(new Date(appointment.date));
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const openCustomerEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerViewOpen(false); // Schließe Ansicht, öffne Bearbeitungsmodal
    setIsCustomerModalOpen(true);
  };


  // CRUD Operationen
  const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'customerName'> & { customerId: string }) => {
    const customerName = customers.find(c => c.id === appointmentData.customerId)?.name || 'Unbekannter Kunde';
    if (editingAppointment) {
      setAppointments(appointments.map(app => app.id === editingAppointment.id ? { ...editingAppointment, ...appointmentData, customerName } : app));
    } else {
      setAppointments([...appointments, { id: Date.now().toString(), ...appointmentData, customerName }]);
    }
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = (id: string) => {
    if (window.confirm("Sind Sie sicher, dass Sie diesen Termin löschen möchten?")) {
      setAppointments(appointments.filter(app => app.id !== id));
    }
  };

  const handleSaveCustomer = (customerData: Omit<Customer, 'id'> | Customer) => {
    if ('id' in customerData && customerData.id) { // existing customer
        setCustomers(customers.map(c => c.id === customerData.id ? customerData : c));
    } else { // new customer
        setCustomers([...customers, { id: Date.now().toString(), ...customerData }]);
    }
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (id: string) => {
    // Optional: Überlegen, was mit Terminen eines gelöschten Kunden passieren soll.
    // Hier werden sie erstmal NICHT gelöscht, sondern hätten einen "ungültigen" customerId
    if (window.confirm("Sind Sie sicher, dass Sie diesen Kunden und alle zugehörigen Termine löschen möchten?")) {
      setCustomers(customers.filter(c => c.id !== id));
      setAppointments(appointments.filter(app => app.customerId !== id)); // Alle Termine des Kunden auch löschen
      setIsCustomerViewOpen(false); // Kundendetailansicht schließen
      setSelectedCustomer(null);
    }
  };

  // Filter und Sortierlogik
  const getAppointmentsForDate = (date: Date | null | undefined): Appointment[] => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];

    return appointments
      .filter(app => {
        if (app.date === dateString) return true;
        if (app.isRecurring) {
          const appDate = new Date(app.date);
          if (appDate > date) return false;

          // Ende der Wiederholung prüfen
          if (app.recurringEndDate && new Date(app.recurringEndDate) < date) {
            // Spezifische Prüfung für das Enddatum: Wenn das Enddatum der Tag selbst ist, soll es noch angezeigt werden.
            if (app.recurringEndDate !== dateString) return false;
          }

          if (app.recurringType === 'daily') return true;
          if (app.recurringType === 'weekly' && appDate.getDay() === date.getDay()) return true;
          if (app.recurringType === 'monthly' && appDate.getDate() === date.getDate()) return true;
          if (app.recurringType === 'yearly' && appDate.getDate() === date.getDate() && appDate.getMonth() === date.getMonth()) return true;
        }
        return false;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const filteredAppointmentsBySearch = useMemo(() => {
    if (!searchTerm) return []; // Keine Termine anzeigen, wenn nicht gesucht wird
    return appointments.filter(app => {
      const customer = customers.find(c => c.id === app.customerId);
      return (
        (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer && customer.firma && customer.firma.toLowerCase().includes(searchTerm.toLowerCase())) ||
        app.task.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
  }, [appointments, customers, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.firma && customer.firma.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      (customer.strasseHnr && customer.strasseHnr.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      (customer.plz && customer.plz.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      (customer.stadt && customer.stadt.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      customer.telefon.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

  // Render-Funktionen für Kalenderansichten
  const renderCalendarDays = () => {
    const dayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Montag = 0, Sonntag = 6
    const daysArray = [];

    for (let i = 0; i < dayOffset; i++) {
      daysArray.push(<div key={`blank-${i}`} className="border p-1 h-24 sm:h-28 dark:border-gray-700 print:h-auto print:p-0.5 print:border-gray-300"></div>);
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
      const dateKey = date.toISOString().split('T')[0];
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = new Date().toISOString().split('T')[0] === dateKey;

      daysArray.push(
        <div
          key={dayNum}
          className={`border p-1 sm:p-2 h-24 sm:h-32 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative print:h-auto print:p-0.5 print:border-gray-300 ${isToday ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
          onClick={() => handleDateClick(dayNum)}
        >
          <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-300' : 'dark:text-gray-300'} print:text-xs`}>{dayNum}</span>
          <div className="mt-1 space-y-0.5 overflow-y-auto max-h-16 sm:max-h-20 text-[10px] sm:text-xs print:max-h-none print:overflow-visible">
            {dayAppointments.slice(0, viewMode === 'month' ? 2 : undefined).map(app => ( // Im Monat nur 2 anzeigen
              <div key={app.id} className="bg-blue-500 text-white p-0.5 rounded-sm truncate dark:bg-blue-700 print:bg-blue-200 print:text-black print:p-0" title={`${app.time} - ${app.customerName}: ${app.task}`}>
                {app.time} {app.customerName}
              </div>
            ))}
            {viewMode === 'month' && dayAppointments.length > 2 && (
              <div className="text-gray-500 dark:text-gray-400 text-center text-[9px] sm:text-[10px] print:hidden">+{dayAppointments.length - 2} weitere</div>
            )}
          </div>
           <button
            onClick={(e) => { e.stopPropagation(); openModalForDate(date); }}
            className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 bg-green-500 hover:bg-green-600 text-white p-0.5 sm:p-1 rounded-full text-xs print:hidden"
            title="Neuer Termin"
          >
            <Plus size={viewMode === 'month' ? 10: 12} />
          </button>
        </div>
      );
    }
    // Fill remaining cells if the month doesn't end on a Saturday
    const totalCells = dayOffset + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
        daysArray.push(<div key={`fill-${i}`} className="border p-1 h-24 sm:h-28 dark:border-gray-700 print:h-auto print:p-0.5 print:border-gray-300"></div>);
    }
    return daysArray;
  };

  const renderWeekView = () => {
    const todayForWeek = selectedDate || new Date(); // Basis ist selectedDate oder aktuelles Datum
    const startOfWeek = new Date(todayForWeek);
    // Setze auf Montag der aktuellen Woche von `todayForWeek`
    startOfWeek.setDate(todayForWeek.getDate() - (todayForWeek.getDay() === 0 ? 6 : todayForWeek.getDay() - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayAppointments = getAppointmentsForDate(day);
      const isCurrentDay = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
      days.push(
        <div key={i} className={`border dark:border-gray-700 p-2 print:border-gray-300 ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
          <h3 className="font-semibold text-center text-sm sm:text-base dark:text-gray-200 print:text-sm">{germanDays[day.getDay()]} {day.getDate()}.{day.getMonth()+1}.</h3>
          <div className="mt-2 space-y-2">
            {dayAppointments.length > 0 ? dayAppointments.map(app => (
              <AppointmentCard key={app.id} appointment={app} onEdit={openModalForEdit} onDelete={handleDeleteAppointment} darkMode={darkMode} />
            )) : <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4 print:text-xs">Keine Termine.</p>}
          </div>
          <button
            onClick={() => openModalForDate(day)}
            className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white p-1 sm:p-2 rounded flex items-center justify-center text-xs sm:text-sm print:hidden"
            title="Neuer Termin"
          >
            <Plus size={14} className="mr-1" /> Termin
          </button>
        </div>
      );
    }
    return <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-gray-200 dark:bg-gray-900 print:grid-cols-1 print:gap-0">{days}</div>;
  };

  const renderDayView = () => {
    const dayToDisplay = selectedDate || new Date(); // Nutze selectedDate oder heutiges Datum
    const dayAppointments = getAppointmentsForDate(dayToDisplay);
    const isCurrentDay = dayToDisplay.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    return (
      <div className={`p-2 sm:p-4 print:p-0 ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 dark:text-gray-100 print:text-lg print:mb-2">
          Termine für {germanDays[dayToDisplay.getDay()]}, {dayToDisplay.getDate()}. {germanMonths[dayToDisplay.getMonth()]} {dayToDisplay.getFullYear()}
        </h2>
        {dayAppointments.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {dayAppointments.map(app => (
              <AppointmentCard key={app.id} appointment={app} onEdit={openModalForEdit} onDelete={handleDeleteAppointment} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 print:text-sm">Keine Termine für diesen Tag.</p>
        )}
        {dayToDisplay && (
          <button
            onClick={() => openModalForDate(dayToDisplay)}
            className="mt-4 sm:mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 sm:px-4 rounded shadow flex items-center text-sm sm:text-base print:hidden"
          >
            <Plus size={18} className="mr-2"/> Neuer Termin
          </button>
        )}
      </div>
    );
  };

  const renderSearchResults = () => (
    <div className="p-2 sm:p-4">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 dark:text-gray-100">Suchergebnisse für "{searchTerm}"</h2>
      {filteredAppointmentsBySearch.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredAppointmentsBySearch.map(app => (
            <AppointmentCard key={app.id} appointment={app} onEdit={openModalForEdit} onDelete={handleDeleteAppointment} darkMode={darkMode} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">Keine Termine gefunden, die Ihrer Suche entsprechen.</p>
      )}
    </div>
  );

  // Haupt-Return der App Komponente
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'} text-gray-900 dark:text-gray-100 transition-colors duration-300 print:bg-white print:text-black`}>
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-3 sm:p-4 shadow-md print:hidden">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center"><Calendar className="mr-2" /> Handwerker Kalender Pro</h1>
          <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Suche Termine..."
              className="p-1.5 sm:p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 sm:p-2 rounded hover:bg-blue-700 dark:hover:bg-blue-900" title={darkMode ? "Light Mode" : "Dark Mode"}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleToday}
              className="p-1.5 sm:p-2 bg-white text-blue-600 dark:bg-gray-200 dark:text-blue-800 rounded shadow hover:bg-gray-50 dark:hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Heute
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-2 sm:p-4">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-2 sm:p-6 print:shadow-none print:border print:border-gray-300">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 print:mb-3">
            {viewMode !== 'customers' && (
            <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-0">
              <button onClick={handlePrevDate} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 print:hidden" title="Vorherige Ansicht"><ChevronLeft /></button>
              <span className="text-lg sm:text-xl font-semibold text-center min-w-[240px] sm:min-w-[280px] dark:text-gray-100 select-none print:text-base">
                {formatDateRangeHeader(currentDate, viewMode)}
              </span>
              <button onClick={handleNextDate} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 print:hidden" title="Nächste Ansicht"><ChevronRight /></button>
            </div>
            )}
            {viewMode === 'customers' && (
              <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-0">
                 <span className="text-lg sm:text-xl font-semibold text-center dark:text-gray-100 select-none print:text-base">
                   Kundenverwaltung
                 </span>
              </div>
            )}
            <div className="flex space-x-1 border border-gray-300 dark:border-gray-600 rounded-md p-0.5 print:hidden">
              { (['day', 'week', 'month', 'customers'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode as ViewMode); // Cast da 'customers' keine ViewMode ist für Termine
                    if (mode === 'customers') {
                      // Logik für Kundenansicht, z.B. Suchbegriff zurücksetzen
                      setSearchTerm('');
                    }
                  }}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${(viewMode === mode || (mode === 'day' && viewMode !== 'week' && viewMode !== 'month' && viewMode !== 'customers')) ? 'bg-blue-500 text-white dark:bg-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : mode === 'month' ? 'Monat' : 'Kunden'}
                </button>
              ))}
            </div>
          </div>

          {searchTerm ? renderSearchResults() : (
            viewMode === 'month' ? (
              <>
                <div className="grid grid-cols-7 gap-px text-center font-semibold mb-1 bg-gray-200 dark:bg-gray-700 print:hidden">
                  {/* Stellt sicher, dass die Tage korrekt für die aktuelle Ansicht angezeigt werden, besonders für Wochenansicht */}
                  {(viewMode === 'month' ? germanDays : (viewMode === 'week' ? getWeekDayHeaders(currentDate, viewMode) : germanDays )).map(day => <div key={day as string} className="py-2 dark:text-gray-300">{day as string}</div>)}
                </div>
                <div className={`grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-900 ${viewMode === 'week' || viewMode === 'day' ? 'print:grid-cols-1' : 'print:grid-cols-7'} print:gap-0`}>
                  {renderCalendarDays()}
                </div>
              </>
            ) : viewMode === 'week' ? renderWeekView() :
               viewMode === 'day' ? renderDayView() : null /* Keine Kalenderansicht für Kunden */
          )}
          {/* Kundenansicht wird jetzt hier gerendert, wenn viewMode 'customers' ist */}
          {viewMode === 'customers' && (
            <div className="mt-0"> {/* Kein extra Margin top, da es die Hauptansicht ist */}
              {/* Die Kundenübersicht-Komponente/Logik wird hier verschoben oder bleibt unten wenn es so besser passt */}
            </div>
          )}
        </div>
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 shadow-xl rounded-lg print:hidden">
          <h2 className="text-xl font-semibold mb-3 dark:text-gray-100">Kundenübersicht</h2>
          <div className="flex mb-3">
            <input
              type="text"
              placeholder="Kunden suchen..."
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-l-md w-full dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customerSearchTerm}
              onChange={e => setCustomerSearchTerm(e.target.value)}
            />
            <button
              onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-r-md flex items-center"
            >
              <Plus size={18} className="mr-1" /> Kunde
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredCustomers.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map(customer => (
                  <li key={customer.id} className="py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center" onClick={() => {setSelectedCustomer(customer); setIsCustomerViewOpen(true);}}>
                    <div>
                      <span className="font-medium dark:text-gray-200">{customer.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({customer.firma || customer.stadt || 'Keine Details'})</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 dark:text-gray-500"/>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Keine Kunden gefunden.</p>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && selectedDate && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
          onSave={handleSaveAppointment}
          selectedDate={selectedDate}
          existingAppointment={editingAppointment}
          customers={customers}
          darkMode={darkMode}
        />
      )}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={handleSaveCustomer}
          existingCustomer={editingCustomer}
          darkMode={darkMode}
        />
      )}
      {isCustomerViewOpen && selectedCustomer && (
        <CustomerViewModal
          isOpen={isCustomerViewOpen}
          onClose={() => setIsCustomerViewOpen(false)}
          customer={selectedCustomer}
          onEdit={openCustomerEditModal}
          onDelete={handleDeleteCustomer}
          darkMode={darkMode}
        />
      )}
       <button
        onClick={() => window.print()}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-3 rounded-full shadow-lg print:hidden"
        title="Drucken"
      >
        <Printer size={24} />
      </button>
    </div>
  );
};

// Sub-Komponenten (AppointmentModal, AppointmentCard etc. bleiben weitgehend gleich, ggf. Anpassungen für Kunden)

type AppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointmentData: Omit<Appointment, 'id' | 'customerName'> & { customerId: string }) => void;
  selectedDate: Date;
  existingAppointment: Appointment | null;
  customers: Customer[];
  darkMode: boolean;
};

const AppointmentModal = ({ isOpen, onClose, onSave, selectedDate, existingAppointment, customers, darkMode }: AppointmentModalProps) => {
  const [time, setTime] = useState(existingAppointment?.time || '09:00');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(existingAppointment?.customerId || (customers.length > 0 ? customers[0].id : ''));
  const [task, setTask] = useState(existingAppointment?.task || '');
  const [duration, setDuration] = useState(existingAppointment?.duration || 1);
  const [isRecurring, setIsRecurring] = useState(existingAppointment?.isRecurring || false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(existingAppointment?.recurringType || 'weekly');
  const [recurringEndDate, setRecurringEndDate] = useState(existingAppointment?.recurringEndDate || '');
  const [errors, setErrors] = useState<Partial<Record<AppointmentErrorKeys, string>>>({});
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);


  const selectedCustomerDetails = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  // Effekt zum Zurücksetzen des Formulars, wenn sich das `existingAppointment` oder `selectedDate` ändert (für neue Termine)
  useEffect(() => {
    if (existingAppointment) {
      setTime(existingAppointment.time);
      setSelectedCustomerId(existingAppointment.customerId);
      setTask(existingAppointment.task);
      setDuration(existingAppointment.duration);
      setIsRecurring(existingAppointment.isRecurring);
      setRecurringType(existingAppointment.recurringType || 'weekly');
      setRecurringEndDate(existingAppointment.recurringEndDate || '');
    } else {
      // Reset für neuen Termin
      setTime('09:00');
      // setSelectedCustomerId(customers.length > 0 ? customers[0].id : ''); // Nicht zurücksetzen, wenn Kunde bereits gewählt
      setTask('');
      setDuration(1);
      setIsRecurring(false);
      setRecurringType('weekly');
      setRecurringEndDate('');
    }
  }, [existingAppointment, selectedDate]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<AppointmentErrorKeys, string>> = {};
    if (!time) newErrors.time = "Uhrzeit ist erforderlich.";
    if (!selectedCustomerId) newErrors.customerId = "Kunde ist erforderlich.";
    if (!task.trim()) newErrors.task = "Aufgabe ist erforderlich.";
    if (duration <= 0) newErrors.duration = "Dauer muss positiv sein.";
    if (isRecurring && recurringEndDate && new Date(recurringEndDate) < new Date(selectedDate.toISOString().split('T')[0])) {
        newErrors.recurringEndDate = "Enddatum der Wiederholung darf nicht vor dem Startdatum liegen.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      date: selectedDate.toISOString().split('T')[0],
      time,
      customerId: selectedCustomerId,
      task,
      duration,
      isRecurring,
      recurringType: isRecurring ? recurringType : undefined,
      recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
    });
  };

  if (!isOpen) return null;
  const modalContentClass = `bg-white ${darkMode ? 'dark:bg-gray-800' : ''} p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 print:hidden">
      <div className={modalContentClass}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold dark:text-gray-100">
            {existingAppointment ? 'Termin bearbeiten' : 'Neuer Termin'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Datum</label>
            <input
              type="text"
              id="date"
              value={selectedDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
              readOnly
              className="mt-1 block w-full px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-sm sm:text-base text-gray-700 dark:text-gray-300"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Uhrzeit</label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
              required
            />
            {errors.time && <p className="text-xs text-red-500 mt-0.5">{errors.time}</p>}
          </div>
          <div>
            <label htmlFor="customer" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Kunde</label>
            <div className="flex items-center">
              <select
                id="customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.customerId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                required
              >
                {customers.length === 0 && <option disabled value="">Bitte zuerst Kunden anlegen</option>}
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name} ({customer.firma || customer.stadt || 'Keine Details'})</option>
                ))}
              </select>
              {selectedCustomerDetails && (
                <button type="button" onClick={() => setShowCustomerInfo(!showCustomerInfo)} className="ml-2 p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Kundeninfo ein/ausblenden">
                  <Info size={18} />
                </button>
              )}
            </div>
            {errors.customerId && <p className="text-xs text-red-500 mt-0.5">{errors.customerId}</p>}
            {showCustomerInfo && selectedCustomerDetails && (
              <div className="mt-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <p><User size={12} className="inline mr-1" /> {selectedCustomerDetails.name}</p>
                {selectedCustomerDetails.firma && <p><Briefcase size={12} className="inline mr-1" /> {selectedCustomerDetails.firma}</p>}
                <p><MapPin size={12} className="inline mr-1" /> {selectedCustomerDetails.strasseHnr}, {selectedCustomerDetails.plz} {selectedCustomerDetails.stadt}</p>
                <p><Phone size={12} className="inline mr-1" /> {selectedCustomerDetails.telefon}</p>
                {selectedCustomerDetails.email && <p><Mail size={12} className="inline mr-1" /> {selectedCustomerDetails.email}</p>}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="task" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Aufgabe/Notiz</label>
            <textarea
              id="task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={2}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.task ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
              required
            ></textarea>
            {errors.task && <p className="text-xs text-red-500 mt-0.5">{errors.task}</p>}
          </div>
          <div>
            <label htmlFor="duration" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Dauer (Stunden)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              min="0.25"
              step="0.25"
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
              required
            />
            {errors.duration && <p className="text-xs text-red-500 mt-0.5">{errors.duration}</p>}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isRecurring" className="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-gray-300">Wiederkehrender Termin</label>
          </div>
          {isRecurring && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <div>
                <label htmlFor="recurringType" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Wiederholungstyp</label>
                <select
                  id="recurringType"
                  value={recurringType}
                  onChange={(e) => setRecurringType(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  className="mt-1 block w-full px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                >
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="yearly">Jährlich</option>
                </select>
              </div>
              <div>
                <label htmlFor="recurringEndDate" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Enddatum der Wiederholung (optional)</label>
                <input
                  type="date"
                  id="recurringEndDate"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={selectedDate.toISOString().split('T')[0]}
                  className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.recurringEndDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                />
                {errors.recurringEndDate && <p className="text-xs text-red-500 mt-0.5">{errors.recurringEndDate}</p>}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <Save size={14} className="mr-1 sm:mr-2" /> Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


type AppointmentCardProps = {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  darkMode: boolean;
};

const AppointmentCard = ({ appointment, onEdit, onDelete, darkMode }: AppointmentCardProps) => {
  const cardDate = new Date(appointment.date);
  // Vergleiche nur Datumsteile, ignoriere Zeit
  const todayDateOnly = new Date();
  todayDateOnly.setHours(0,0,0,0);
  const isPast = cardDate < todayDateOnly;
  const isToday = cardDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];


  return (
    <div className={`bg-white ${darkMode ? 'dark:bg-gray-800' : ''} shadow-lg rounded-lg p-3 sm:p-4 border-l-4 ${isPast && !isToday ? 'border-gray-400 dark:border-gray-600 opacity-70' : isToday ? 'border-green-500 dark:border-green-700' : 'border-blue-500 dark:border-blue-700'} transition-shadow hover:shadow-xl print:shadow-none print:border print:border-gray-300 print:p-2`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-md sm:text-lg font-semibold ${isPast && !isToday ? 'text-gray-600 dark:text-gray-400' : isToday ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'} print:text-sm`}>{appointment.customerName}</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-center print:text-xs"><Clock size={12} className="mr-1.5 text-gray-500 dark:text-gray-400"/>{appointment.time} Uhr ({appointment.duration}h)</p>
          {isToday && (
             <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block print:hidden">Heute</span>
          )}
          {isPast && !isToday && <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block print:hidden">Vergangen</span>}

        </div>
        <div className="flex space-x-1 sm:space-x-2 print:hidden">
          <button onClick={() => onEdit(appointment)} className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 sm:p-1.5 rounded-md hover:bg-yellow-100 dark:hover:bg-gray-700" title="Bearbeiten">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(appointment.id)} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 sm:p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-gray-700" title="Löschen">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-200 mt-1.5 sm:mt-2 whitespace-pre-wrap text-sm sm:text-base print:text-xs print:mt-1">{appointment.task}</p>
      {appointment.isRecurring && (
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 print:text-[9px] print:mt-1">
          Wiederkehrend: {appointment.recurringType === 'daily' ? 'Täglich' : appointment.recurringType === 'weekly' ? 'Wöchentlich' : appointment.recurringType === 'monthly' ? 'Monatlich' : 'Jährlich'}
          {appointment.recurringEndDate && ` bis ${new Date(appointment.recurringEndDate).toLocaleDateString('de-DE')}`}
        </p>
      )}
       {isPast && !isToday && !appointment.isRecurring && ( // Nur anzeigen wenn vergangen UND nicht wiederkehrend
        <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-md flex items-center text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 print:hidden">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
            Dieser Termin liegt in der Vergangenheit.
        </div>
      )}
    </div>
  );
};

// --- Customer Management Modals & Components ---
type CustomerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id'> | Customer) => void;
  existingCustomer: Customer | null;
  darkMode: boolean;
};

const CustomerModal = ({ isOpen, onClose, onSave, existingCustomer, darkMode }: CustomerModalProps) => {
  const [name, setName] = useState(existingCustomer?.name || '');
  const [firma, setFirma] = useState(existingCustomer?.firma || '');
  const [strasseHnr, setStrasseHnr] = useState(existingCustomer?.strasseHnr || '');
  const [plz, setPlz] = useState(existingCustomer?.plz || '');
  const [stadt, setStadt] = useState(existingCustomer?.stadt || '');
  const [telefon, setTelefon] = useState(existingCustomer?.telefon || '');
  const [email, setEmail] = useState(existingCustomer?.email || '');
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Customer, 'id'>, string>>>({});

  useEffect(() => {
    if (existingCustomer) {
      setName(existingCustomer.name);
      setFirma(existingCustomer.firma || '');
      setStrasseHnr(existingCustomer.strasseHnr);
      setPlz(existingCustomer.plz);
      setStadt(existingCustomer.stadt);
      setTelefon(existingCustomer.telefon);
      setEmail(existingCustomer.email || '');
    } else {
      setName('');
      setFirma('');
      setStrasseHnr('');
      setPlz('');
      setStadt('');
      setTelefon('');
      setEmail('');
    }
  }, [existingCustomer]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<Customer, 'id'>, string>> = {};
    if (!name.trim()) newErrors.name = "Name ist erforderlich.";
    if (!strasseHnr.trim()) newErrors.strasseHnr = "Straße und Hausnummer sind erforderlich.";
    if (!plz.trim()) newErrors.plz = "PLZ ist erforderlich.";
    if (plz.trim() && !/^\d{5}$/.test(plz.trim())) newErrors.plz = "PLZ muss 5-stellig sein.";
    if (!stadt.trim()) newErrors.stadt = "Stadt ist erforderlich.";
    if (!telefon.trim()) newErrors.telefon = "Telefonnummer ist erforderlich.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const customerData = {
      name,
      firma,
      strasseHnr,
      plz,
      stadt,
      telefon,
      email,
    };

    if (existingCustomer) {
      onSave({ ...existingCustomer, ...customerData });
    } else {
      onSave(customerData);
    }
  };

  if (!isOpen) return null;
  const modalContentClass = `bg-white ${darkMode ? 'dark:bg-gray-800' : ''} p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 print:hidden">
      <div className={modalContentClass}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold dark:text-gray-100">
            {existingCustomer ? 'Kunde bearbeiten' : 'Neuer Kunde'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="customerNameModal" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              id="customerNameModal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
              required
            />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="firma" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Firma (optional)</label>
            <input
              type="text"
              id="firma"
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
            />
          </div>
          <div>
            <label htmlFor="strasseHnr" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Straße & Nr.</label>
            <input
              type="text"
              id="strasseHnr"
              value={strasseHnr}
              onChange={(e) => setStrasseHnr(e.target.value)}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.strasseHnr ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
              required
            />
            {errors.strasseHnr && <p className="text-xs text-red-500 mt-0.5">{errors.strasseHnr}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label htmlFor="plz" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">PLZ</label>
              <input
                type="text"
                id="plz"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.plz ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                required
              />
              {errors.plz && <p className="text-xs text-red-500 mt-0.5">{errors.plz}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="stadt" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Stadt</label>
              <input
                type="text"
                id="stadt"
                value={stadt}
                onChange={(e) => setStadt(e.target.value)}
                className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.stadt ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
                required
              />
              {errors.stadt && <p className="text-xs text-red-500 mt-0.5">{errors.stadt}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="telefon" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
            <input
              type="tel"
              id="telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 ${errors.telefon ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
              required
            />
            {errors.telefon && <p className="text-xs text-red-500 mt-0.5">{errors.telefon}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail (optional)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full px-3 py-1.5 sm:py-2 border dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base`}
            />
          </div>
          <div className="flex justify-end space-x-2 sm:space-x-3 pt-2">
             <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <Save size={14} className="mr-1 sm:mr-2" /> Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

type CustomerViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  darkMode: boolean;
};

const CustomerViewModal = ({ isOpen, onClose, customer, onEdit, onDelete, darkMode }: CustomerViewModalProps) => {
  if (!isOpen) return null;
  const modalContentClass = `bg-white ${darkMode ? 'dark:bg-gray-800' : ''} p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 print:hidden">
      <div className={modalContentClass}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold dark:text-gray-100 flex items-center"><User className="mr-2" />{customer.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X size={22} /></button>
        </div>
        <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
          {customer.firma && <p className="flex items-center"><Briefcase size={14} className="mr-2 text-gray-500 dark:text-gray-400"/> {customer.firma}</p>}
          <p className="flex items-center"><MapPin size={14} className="mr-2 text-gray-500 dark:text-gray-400"/> {customer.strasseHnr}, {customer.plz} {customer.stadt}</p>
          <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500 dark:text-gray-400"/> {customer.telefon}</p>
          {customer.email && <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500 dark:text-gray-400"/> {customer.email}</p>}
        </div>
        <div className="mt-5 sm:mt-6 flex justify-end space-x-2 sm:space-x-3">
          <button
            onClick={() => {
                onDelete(customer.id);
            }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm flex items-center"
          >
            <Trash2 size={14} className="mr-1 sm:mr-2"/> Löschen
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md shadow-sm flex items-center"
          >
            <Edit2 size={14} className="mr-1 sm:mr-2"/> Bearbeiten
          </button>
        </div>
      </div>
    </div>
  );
};


export default App;

// Helper to get day headers for week view starting Monday
const getWeekDayHeaders = (dateForWeek: Date, currentViewMode: ViewMode) => {
  if (currentViewMode !== 'week') return germanDays;
  const startOfWeek = new Date(dateForWeek);
  startOfWeek.setDate(dateForWeek.getDate() - (dateForWeek.getDay() === 0 ? 6 : dateForWeek.getDay() -1)); // Adjust to Monday
  const headers = [];
  for (let i=0; i<7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    headers.push(`${germanDays[d.getDay()]} ${d.getDate()}`);
  }
  return headers;
};

// Funktion zur Berechnung der Kalenderwoche (ISO 8601)
const getCalendarWeek = (date: Date): number => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7; // Montag = 0, Sonntag = 6 (UTC)
  target.setUTCDate(target.getUTCDate() - dayNr + 3); // Gehe zum Donnerstag derselben Woche
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  // Kalenderwoche ist die Anzahl der vollen Wochen zwischen dem ersten Donnerstag des Jahres und dem Donnerstag der aktuellen Woche plus eins
  return 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + dayNr ) / 7);
};


const formatDateRangeHeader = (date: Date, viewMode: ViewMode): string => {
  if (viewMode === 'day') {
    return date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } else if (viewMode === 'week') {
    const weekStart = new Date(date);
    // Montag dieser Woche (getDay: So=0, Mo=1,... Sa=6)
    weekStart.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const kw = getCalendarWeek(date);
    return `KW ${kw}: ${weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else if (viewMode === 'month') {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }
  return ''; // Fallback für 'customers' oder unbekannte viewModes
};
