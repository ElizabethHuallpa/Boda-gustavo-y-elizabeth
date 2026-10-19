/* ===================== RSVP · CONFIGURACIÓN (editable) =====================
   Lista de invitados: n = nombre completo, p = asistentes autorizados.
   Reemplaza los 3 nombres de prueba por tu lista real. */
const RSVP_CONFIG={
  guests:[
    {n:"Invitado de Prueba Uno",p:2},
    {n:"Invitada de Prueba Dos",p:1},
    {n:"Familia Prueba Tres",p:4}
  ],
  unlistedPasses:1,  // asistentes permitidos si el nombre no está en la lista
  seatsCap:10        // tope de seguridad
};
