import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Wrench, Camera, FileText, Plus, X, Edit3, Save, MapPin, Phone, Euro } from 'lucide-react';

const HandwerkerKalender = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      title: 'Heizung Wartung - Familie Müller',
      date: '2025-05-31',
      time: '09:00',
      duration: 120,
      customer: 'Familie Müller',
      address: 'Hauptstraße 12, 99894 Friedrichroda',
      phone: '03623/123456',
      status: 'geplant',
      category: 'wartung',
      notes: 'Gasheizung Viessmann, Baujahr 2018. Wartungsvertrag läuft bis Dezember.',
      materials: ['Brennerdüse', 'Filter', 'Zündkerze'],
      hours: 0,
      photos: []
    },
    {
      id: 2,
      title: 'Badezimmer Renovierung - Schmidt GmbH',
      date: '2025-06-02',
      time: '08:00',
      duration: 480,
      customer: 'Schmidt GmbH',
      address: 'Industriestr. 5, 99894 Friedrichroda',
      phone: '03623/789012',
      status: 'in_arbeit',
      category: 'renovierung',
      notes: 'Komplette Badsanierung, Fliesen verlegen, neue Sanitäranlagen',
      materials: ['Fliesen 60x60cm', 'Fugenmörtel', 'WC-Garnitur'],
      hours: 6.5,
      photos: []
    }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const statusColors = {
    'geplant': 'bg-blue-100 border-blue-400 text-blue-800',
    'in_arbeit': 'bg-orange-100 border-orange-400 text-orange-800',
    'abgeschlossen': 'bg-green-100 border-green-400 text-green-800',
    'verschoben': 'bg-gray-100 border-gray-400 text-gray-800'
  };

  const categoryColors = {
    'wartung': 'bg-blue-50 border-l-4 border-blue-400',
    'reparatur': 'bg-red-50 border-l-4 border-red-400',
    'renovierung': 'bg-purple-50 border-l-4 border-purple-400',
    'installation': 'bg-green-50 border-l-4 border-green-400'
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start with Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1); // Start with Monday

    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (7 - lastDay.getDay()) % 7);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => apt.date === formatDate(date));
  };

  const openAppointmentModal = (appointment = null) => {
    setSelectedAppointment(appointment || {
      id: Date.now(),
      title: '',
      date: formatDate(currentDate),
      time: '09:00',
      duration: 120,
      customer: '',
      address: '',
      phone: '',
      status: 'geplant',
      category: 'wartung',
      notes: '',
      materials: [],
      hours: 0,
      photos: []
    });
    setEditMode(!appointment);
    setShowModal(true);
  };

  const saveAppointment = () => {
    if (selectedAppointment.id && appointments.find(a => a.id === selectedAppointment.id)) {
      setAppointments(appointments.map(a => 
        a.id === selectedAppointment.id ? selectedAppointment : a
      ));
    } else {
      setAppointments([...appointments, selectedAppointment]);
    }
    setShowModal(false);
    setEditMode(false);
  };

  const deleteAppointment = () => {
    setAppointments(appointments.filter(a => a.id !== selectedAppointment.id));
    setShowModal(false);
  };

  const addMaterial = () => {
    const material = prompt('Material hinzufügen:');
    if (material) {
      setSelectedAppointment({
        ...selectedAppointment,
        materials: [...selectedAppointment.materials, material]
      });
    }
  };

  const removeMaterial = (index) => {
    setSelectedAppointment({
      ...selectedAppointment,
      materials: selectedAppointment.materials.filter((_, i) => i !== index)
    });
  };

  const MonthView = () => {
    const monthDays = getMonthDays();
    const weeks = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {monthDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = formatDate(day) === formatDate(new Date());
            
            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-32 cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
                } ${isToday ? 'bg-blue-50 border-2 border-blue-200' : ''}`}
                onClick={() => {
                  setCurrentDate(day);
                  setView('day');
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(apt => (
                    <div
                      key={apt.id}
                      className={`text-xs p-1 rounded truncate ${categoryColors[apt.category]} ${statusColors[apt.status]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openAppointmentModal(apt);
                      }}
                    >
                      <div className="font-medium">{apt.time}</div>
                      <div className="truncate">{apt.title}</div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayAppointments.length - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const WeekView = () => (
    <div className="grid grid-cols-8 gap-1 h-full">
      <div className="bg-gray-50 p-2 font-semibold text-center">Zeit</div>
      {getWeekDays().map((day, index) => (
        <div key={index} className="bg-gray-50 p-2 text-center">
          <div className="font-semibold">{day.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
          <div className="text-sm">{day.getDate()}.{day.getMonth() + 1}</div>
        </div>
      ))}
      
      {Array.from({ length: 12 }, (_, hour) => (
        <React.Fragment key={hour}>
          <div className="bg-gray-50 p-2 text-sm text-center border-t">
            {(hour + 7).toString().padStart(2, '0')}:00
          </div>
          {getWeekDays().map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDate(day);
            const hourAppointments = dayAppointments.filter(apt => {
              const aptHour = parseInt(apt.time.split(':')[0]);
              return aptHour === hour + 7;
            });
            
            return (
              <div key={dayIndex} className="border-t border-gray-200 p-1 min-h-16 relative">
                {hourAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className={`text-xs p-2 rounded cursor-pointer mb-1 ${categoryColors[apt.category]} ${statusColors[apt.status]}`}
                    onClick={() => openAppointmentModal(apt)}
                  >
                    <div className="font-semibold truncate">{apt.title}</div>
                    <div className="text-xs">{apt.time} - {apt.customer}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );

  const DayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {currentDate.toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        
        <div className="grid gap-4">
          {dayAppointments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Keine Termine für heute geplant
            </div>
          ) : (
            dayAppointments.map(apt => (
              <div
                key={apt.id}
                className={`p-4 rounded-lg cursor-pointer ${categoryColors[apt.category]} ${statusColors[apt.status]}`}
                onClick={() => openAppointmentModal(apt)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{apt.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {apt.time} ({apt.duration} Min)
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={16} />
                        {apt.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={16} />
                        {apt.phone}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="mt-2 text-sm text-gray-700">{apt.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[apt.status]}`}>
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const AppointmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {editMode ? 'Termin bearbeiten' : 'Termin Details'}
            </h2>
            <div className="flex gap-2">
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit3 size={20} />
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titel</label>
              <input
                type="text"
                value={selectedAppointment?.title || ''}
                onChange={(e) => setSelectedAppointment({...selectedAppointment, title: e.target.value})}
                disabled={!editMode}
                className="w-full p-2 border rounded-md disabled:bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <input
                  type="date"
                  value={selectedAppointment?.date || ''}
                  onChange={(e) => setSelectedAppointment({...selectedAppointment, date: e.target.value})}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Uhrzeit</label>
                <input
                  type="time"
                  value={selectedAppointment?.time || ''}
                  onChange={(e) => setSelectedAppointment({...selectedAppointment, time: e.target.value})}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kunde</label>
                <input
                  type="text"
                  value={selectedAppointment?.customer || ''}
                  onChange={(e) => setSelectedAppointment({...selectedAppointment, customer: e.target.value})}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <input
                  type="tel"
                  value={selectedAppointment?.phone || ''}
                  onChange={(e) => setSelectedAppointment({...selectedAppointment, phone: e.target.value})}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                value={selectedAppointment?.address || ''}
                onChange={(e) => setSelectedAppointment({...selectedAppointment, address: e.target.value})}
                disabled={!editMode}
                className="w-full p-2 border rounded-md disabled:bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={selectedAppointment?.status || ''}
                  onChange={(e) => setSelectedAppointment({...selectedAppointment, status: e.target.value})}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md disabled:bg-gray-50"
                >
                  <option value="geplant">Geplant</option>
                  <option value="in_arbeit">In Arbeit</option>
                  <option value="abgeschlossen">Abgeschlossen</option>
                  <option value="verschoben">Verschoben</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategorie</label>
                <select
                  value={selectedAppointment?.category || ''}
                  onChange={(e) => setSelectedAppointment({...selectedAppointment, category: e.target.value})}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md disabled:bg-gray-50"
                >
                  <option value="wartung">Wartung</option>
                  <option value="reparatur">Reparatur</option>
                  <option value="renovierung">Renovierung</option>
                  <option value="installation">Installation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Arbeitsstunden</label>
              <input
                type="number"
                step="0.5"
                value={selectedAppointment?.hours || 0}
                onChange={(e) => setSelectedAppointment({...selectedAppointment, hours: parseFloat(e.target.value)})}
                disabled={!editMode}
                className="w-full p-2 border rounded-md disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notizen</label>
              <textarea
                value={selectedAppointment?.notes || ''}
                onChange={(e) => setSelectedAppointment({...selectedAppointment, notes: e.target.value})}
                disabled={!editMode}
                rows="3"
                className="w-full p-2 border rounded-md disabled:bg-gray-50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Material</label>
                {editMode && (
                  <button
                    onClick={addMaterial}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Hinzufügen
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {selectedAppointment?.materials?.map((material, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span>{material}</span>
                    {editMode && (
                      <button
                        onClick={() => removeMaterial(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <div>
              {editMode && selectedAppointment?.id && (
                <button
                  onClick={deleteAppointment}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Löschen
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={saveAppointment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save size={16} />
                    Speichern
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Schließen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Wrench className="text-blue-600" />
              Handwerker Kalender
            </h1>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'day' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Tag
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'week' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Woche
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  view === 'month' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Monat
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else if (view === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else {
                    newDate.setDate(newDate.getDate() - 1);
                  }
                  setCurrentDate(newDate);
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                ‹
              </button>
              
              <span className="font-medium text-lg min-w-48 text-center">
                {view === 'week' 
                  ? `${getWeekDays()[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${getWeekDays()[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : view === 'month'
                  ? currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
                  : currentDate.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                }
              </span>
              
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else if (view === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else {
                    newDate.setDate(newDate.getDate() + 1);
                  }
                  setCurrentDate(newDate);
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                ›
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Heute
            </button>

            <button
              onClick={() => openAppointmentModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Neuer Termin
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto p-4">
        {view === 'month' ? <MonthView /> : view === 'week' ? <WeekView /> : <DayView />}
      </div>

      {/* Modal */}
      {showModal && <AppointmentModal />}
    </div>
  );
};

export default HandwerkerKalender;