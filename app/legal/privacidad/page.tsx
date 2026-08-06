import type { Metadata } from "next";
import PaginaLegal, { Apartado, Destacado, Lista } from "@/components/PaginaLegal";
import { TITULAR, ENCARGADOS, complementoTitular } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad — Dressé",
  description:
    "Qué datos guarda Dressé, para qué los usa, con quién los comparte y cómo ejercer tus derechos.",
};

export default function Privacidad() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      entradilla="Aquí te contamos qué datos tuyos guardamos, para qué los usamos, con quién los compartimos y cómo puedes recuperarlos o borrarlos. Sin letra pequeña."
    >
      <Apartado n={1} titulo="Quién trata tus datos">
        <p>
          El responsable del tratamiento es <strong>{TITULAR.nombre}</strong>
          {complementoTitular()}, titular de la aplicación {TITULAR.marca} (
          {TITULAR.web}).
        </p>
        <p>
          Para cualquier asunto relacionado con tus datos puedes escribir a{" "}
          <a href={`mailto:${TITULAR.email}`} className="underline">
            {TITULAR.email}
          </a>
          .
        </p>
      </Apartado>

      <Apartado n={2} titulo="Qué datos recogemos">
        <p>Solo lo que hace falta para que la aplicación funcione:</p>
        <Lista>
          <li>
            <strong>Tu cuenta.</strong> Tu correo electrónico y una contraseña
            cifrada. Si entras con Google, recibimos de Google tu correo, tu
            nombre y tu foto de perfil. Nunca vemos tu contraseña de Google.
          </li>
          <li>
            <strong>Tu perfil.</strong> Nombre, nombre de usuaria, descripción,
            foto de perfil, estilo, idioma, tema visual y si tu cuenta es privada.
          </li>
          <li>
            <strong>Tu fecha de nacimiento.</strong> Solo para comprobar que
            tienes la edad mínima. No se muestra a nadie ni se usa para
            ninguna otra cosa.
          </li>
          <li>
            <strong>Tu armario.</strong> Las fotos de tus prendas y lo que
            anotas sobre ellas: categoría, color, marca, estilo, temporada y con
            qué frecuencia las usas.
          </li>
          <li>
            <strong>Tus looks, tu lista de deseos y tus tableros.</strong>
          </li>
          <li>
            <strong>Tu historial con Madame Dressé.</strong> Las consultas que le
            haces y los consejos que te da.
          </li>
          <li>
            <strong>Tu actividad en la comunidad.</strong> Publicaciones,
            comentarios, «me gusta», a quién sigues y quién te sigue.
          </li>
          <li>
            <strong>Datos técnicos.</strong> Nuestros proveedores registran de
            forma automática la dirección IP, el tipo de navegador y las
            incidencias, para detectar fallos y usos abusivos. No usamos ninguna
            herramienta de analítica ni de publicidad, ni cookies de seguimiento:
            las únicas cookies que se instalan son las necesarias para mantener
            tu sesión abierta.
          </li>
        </Lista>
        <Destacado>
          <strong>Sobre tus fotos.</strong> Sube fotos de ropa. Si en una foto
          aparece tu cara, tu casa o cualquier otro dato tuyo o de terceros, esa
          información se guarda y se envía a analizar igual que el resto de la
          imagen. Te recomendamos evitarlo. No usamos ninguna tecnología de
          reconocimiento facial ni identificamos a nadie a partir de las
          imágenes.
        </Destacado>
      </Apartado>

      <Apartado n={3} titulo="Para qué los usamos y con qué base legal">
        <Lista>
          <li>
            <strong>Para prestarte el servicio</strong> —crear tu cuenta, guardar
            tu armario, generar consejos, publicar en la comunidad—. Base legal:
            la ejecución del contrato que aceptas al registrarte (art. 6.1.b del
            RGPD).
          </li>
          <li>
            <strong>Para mantener la aplicación segura</strong> y prevenir
            fraudes y abusos. Base legal: nuestro interés legítimo en proteger el
            servicio y a quienes lo usan (art. 6.1.f).
          </li>
          <li>
            <strong>Para cumplir la ley</strong> cuando estamos obligados a
            conservar o facilitar información (art. 6.1.c).
          </li>
          <li>
            <strong>Para enviarte avisos</strong>, solo si los activas. Base
            legal: tu consentimiento (art. 6.1.a), que puedes retirar cuando
            quieras desde Ajustes.
          </li>
        </Lista>
        <p>
          <strong>No vendemos tus datos a nadie</strong>, no los cedemos con
          fines publicitarios y no tomamos decisiones automatizadas que produzcan
          efectos jurídicos sobre ti.
        </p>
      </Apartado>

      <Apartado n={4} titulo="Inteligencia artificial: qué pasa con tus fotos">
        <p>
          Dressé usa inteligencia artificial en dos sitios: al añadir una prenda,
          para reconocer de qué se trata y de qué color es, y en Madame Dressé,
          la asesora que te sugiere combinaciones.
        </p>
        <Destacado>
          <p>
            <strong>
              Para que esto funcione, tus fotos y los datos de tus prendas se
              envían a Anthropic, una empresa de Estados Unidos, que los procesa
              y nos devuelve el resultado.
            </strong>
          </p>
          <p className="mt-3">
            Se envían con un enlace temporal que caduca. Anthropic actúa como
            encargado del tratamiento: trata esos datos únicamente para
            devolvernos la respuesta, y no los utiliza para entrenar sus modelos.
          </p>
        </Destacado>
        <p>
          <strong>Madame Dressé no es una persona.</strong> Es un programa de
          inteligencia artificial. Sus consejos son sugerencias de estilo
          generadas automáticamente: pueden equivocarse, describir mal una prenda
          o proponer combinaciones que no tengan sentido. No los tomes como
          asesoramiento profesional de ningún tipo.
        </p>
        <p>
          Si prefieres que tus fotos no se envíen a analizar, no uses el
          reconocimiento automático al añadir prendas ni Madame Dressé. El resto
          de la aplicación funciona igual.
        </p>
      </Apartado>

      <Apartado n={5} titulo="Quién más ve tus datos">
        <p>
          No cedemos tus datos a terceros. Sí trabajamos con proveedores que los
          tratan por encargo nuestro y siguiendo nuestras instrucciones:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-4 font-medium">Proveedor</th>
                <th className="py-2 pr-4 font-medium">Para qué</th>
                <th className="py-2 font-medium">Dónde</th>
              </tr>
            </thead>
            <tbody>
              {ENCARGADOS.map((e) => (
                <tr key={e.nombre} className="border-b border-line align-top">
                  <td className="py-3 pr-4 font-medium">{e.nombre}</td>
                  <td className="py-3 pr-4">{e.para}</td>
                  <td className="py-3 text-muted">{e.donde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Algunos de estos proveedores están en Estados Unidos, fuera del Espacio
          Económico Europeo. Esas transferencias se amparan en las cláusulas
          contractuales tipo aprobadas por la Comisión Europea o en el marco de
          privacidad de datos UE-EE. UU., según el proveedor.
        </p>
        <p>
          Además, lo que publiques en la comunidad lo verán otras usuarias. Si
          pones tu cuenta en privado desde Ajustes, tu armario y tus
          publicaciones solo serán visibles para quienes apruebes.
        </p>
      </Apartado>

      <Apartado n={6} titulo="Cuánto tiempo los guardamos">
        <p>
          Mientras tengas la cuenta abierta. Cuando la borras, eliminamos tus
          datos y tus fotos de forma inmediata y sin copia de seguridad
          recuperable, salvo lo que estemos obligados a conservar por ley
          (por ejemplo, facturación) o lo necesario para atender una reclamación.
        </p>
        <p>
          Los registros técnicos de seguridad se conservan un máximo de doce
          meses.
        </p>
      </Apartado>

      <Apartado n={7} titulo="Tus derechos">
        <p>
          Puedes ejercer estos derechos en cualquier momento y gratis:
        </p>
        <Lista>
          <li>
            <strong>Acceso y portabilidad.</strong> Descargar todo lo que
            guardamos de ti.
          </li>
          <li>
            <strong>Supresión.</strong> Borrar tu cuenta y todos tus datos.
          </li>
          <li>
            <strong>Rectificación.</strong> Corregir lo que esté mal.
          </li>
          <li>
            <strong>Limitación y oposición.</strong> Pedirnos que dejemos de
            tratar tus datos en determinados casos.
          </li>
          <li>
            <strong>Retirar tu consentimiento</strong> cuando el tratamiento se
            base en él, sin que ello afecte a lo hecho antes.
          </li>
        </Lista>
        <Destacado>
          Los dos más importantes los tienes dentro de la propia aplicación, en{" "}
          <strong>Perfil → Ajustes</strong>: «Descargar mis datos» y «Borrar mi
          cuenta». No hace falta que nos escribas ni que expliques por qué.
        </Destacado>
        <p>
          Para el resto, escribe a{" "}
          <a href={`mailto:${TITULAR.email}`} className="underline">
            {TITULAR.email}
          </a>
          . Responderemos en el plazo máximo de un mes.
        </p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes reclamar ante la
          Agencia Española de Protección de Datos (C/ Jorge Juan 6, 28001 Madrid,{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            www.aepd.es
          </a>
          ). Te agradeceríamos que nos lo contaras antes, para intentar
          resolverlo.
        </p>
      </Apartado>

      <Apartado n={8} titulo="Menores de edad">
        <p>
          Dressé no está dirigida a menores de 14 años y no pueden registrarse.
          Entre los 14 y los 18 puedes usarla, pero te recomendamos hablarlo
          antes con tu madre, tu padre o quien te tenga a su cargo.
        </p>
        <p>
          Por eso te pedimos la fecha de nacimiento al crear la cuenta. Es una
          declaración tuya: no comprobamos ningún documento, igual que hacen
          otras aplicaciones que no piden el DNI.
        </p>
        <p>
          Si detectamos una cuenta de un menor de 14 años, la eliminaremos. Si
          eres madre, padre o tutor y crees que tu hijo o hija se ha registrado,
          escríbenos a{" "}
          <a href={`mailto:${TITULAR.email}`} className="underline">
            {TITULAR.email}
          </a>{" "}
          y la borraremos.
        </p>
      </Apartado>

      <Apartado n={9} titulo="Cómo protegemos tus datos">
        <Lista>
          <li>Todo viaja cifrado entre tu móvil y nuestros servidores.</li>
          <li>
            Tus fotos no son públicas: se sirven mediante enlaces temporales que
            caducan y que solo se generan para quien ha iniciado sesión.
          </li>
          <li>
            La base de datos comprueba en cada consulta quién eres, de forma que
            nadie pueda leer los datos de otra persona aunque lo intente
            saltándose la aplicación.
          </li>
          <li>Las contraseñas se guardan cifradas y no podemos verlas.</li>
        </Lista>
        <p>
          Ningún sistema es infalible. Si a pesar de todo se produjera una brecha
          de seguridad que suponga un riesgo para ti, te lo comunicaremos y lo
          notificaremos a la Agencia Española de Protección de Datos en el plazo
          de 72 horas, como exige la ley.
        </p>
      </Apartado>

      <Apartado n={10} titulo="Cambios en esta política">
        <p>
          Si cambiamos algo importante te avisaremos dentro de la aplicación
          antes de que entre en vigor. La fecha del principio indica siempre
          cuándo se revisó por última vez.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
