import type { Metadata } from "next";
import Link from "next/link";
import PaginaLegal, { Apartado, Destacado, Lista } from "@/components/PaginaLegal";
import { TITULAR, complementoTitular } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos de uso — Dressé",
  description:
    "Las condiciones de uso de Dressé: quién puede usarla, qué puedes publicar, qué hacemos con tus fotos y qué no podemos garantizarte.",
};

export default function Terminos() {
  return (
    <PaginaLegal
      titulo="Términos de uso"
      entradilla="Las reglas del juego. Al crear una cuenta en Dressé aceptas lo que hay aquí escrito, así que merece la pena leerlo: está en castellano llano y no es largo."
    >
      <Apartado n={1} titulo="Quiénes somos y qué es Dressé">
        <p>
          {TITULAR.marca} es una aplicación de{" "}
          <strong>{TITULAR.nombre}</strong>
          {complementoTitular()}, disponible en {TITULAR.web}. Puedes
          escribirnos a{" "}
          <a href={`mailto:${TITULAR.email}`} className="underline">
            {TITULAR.email}
          </a>
          .
        </p>
        <p>
          Dressé es un armario digital: fotografías tu ropa, la organizas, creas
          conjuntos, guardas una lista de deseos, recibes sugerencias de estilo
          generadas por inteligencia artificial y compartes lo que quieras con
          una comunidad de personas a las que también les gusta la moda.
        </p>
      </Apartado>

      <Apartado n={2} titulo="Quién puede usarla">
        <p>
          Tienes que tener <strong>14 años o más</strong>. Si eres menor de edad
          pero mayor de 14, te recomendamos que lo hables con tu madre, tu padre
          o quien te tenga a su cargo antes de registrarte.
        </p>
        <p>
          Si te registras en nombre de una empresa o una marca, confirmas que
          tienes autorización para hacerlo.
        </p>
      </Apartado>

      <Apartado n={3} titulo="Tu cuenta">
        <Lista>
          <li>Los datos que nos des tienen que ser ciertos.</li>
          <li>
            La contraseña es tuya y solo tuya. Si crees que alguien ha entrado en
            tu cuenta, avísanos cuanto antes.
          </li>
          <li>Una persona, una cuenta. No suplantes a nadie.</li>
          <li>
            Puedes cerrar tu cuenta cuando quieras desde{" "}
            <strong>Perfil → Ajustes → Borrar mi cuenta</strong>. Es inmediato e
            irreversible.
          </li>
        </Lista>
      </Apartado>

      <Apartado n={4} titulo="Tus fotos y tus contenidos son tuyos">
        <p>
          Todo lo que subes —fotos de tus prendas, looks, publicaciones,
          comentarios— <strong>sigue siendo tuyo</strong>. No nos quedamos con la
          propiedad de nada.
        </p>
        <p>
          Lo que sí necesitamos es tu permiso para poder hacer funcionar la
          aplicación: guardar tus imágenes, mostrártelas, enviarlas a analizar
          para reconocer las prendas y enseñárselas a quien tú decidas. Ese
          permiso es gratuito, no exclusivo, y{" "}
          <strong>termina cuando borras el contenido o la cuenta</strong>.
        </p>
        <p>
          No usamos tus fotos para publicidad ni las cedemos a nadie con fines
          comerciales. Si algún día quisiéramos usar una imagen tuya para
          promocionar Dressé, te lo pediríamos antes y tendrías que decir que sí.
        </p>
        <p>
          Al subir algo confirmas que tienes derecho a hacerlo: que la foto es
          tuya o tienes permiso, y que si aparece otra persona, esa persona está
          de acuerdo.
        </p>
      </Apartado>

      <Apartado n={5} titulo="Lo que no se puede hacer">
        <Lista>
          <li>
            Publicar contenido ilegal, violento, sexual, que incite al odio o que
            acose a alguien.
          </li>
          <li>Subir fotos de otras personas sin su permiso.</li>
          <li>Usar imágenes con derechos de autor que no sean tuyas.</li>
          <li>Suplantar a otra persona o marca.</li>
          <li>
            Enviar publicidad no solicitada, estafas o enlaces a sitios
            fraudulentos.
          </li>
          <li>
            Intentar acceder a datos de otras usuarias, saltarse las medidas de
            seguridad o extraer información de forma masiva y automatizada.
          </li>
          <li>
            Sobrecargar el servicio a propósito o interferir en su
            funcionamiento.
          </li>
        </Lista>
        <p>
          Si nos llega un aviso o detectamos algo de esto, podemos retirar el
          contenido y, si es grave o se repite, suspender o cerrar la cuenta. Te
          diremos por qué y podrás responder, salvo que la ley nos lo impida.
        </p>
      </Apartado>

      <Apartado n={6} titulo="Madame Dressé es un programa, no una estilista">
        <Destacado>
          <p>
            <strong>
              Los consejos de Madame Dressé los genera automáticamente un sistema
              de inteligencia artificial.
            </strong>
          </p>
          <p className="mt-3">
            Puede equivocarse: confundir una prenda, no acertar con un color o
            sugerirte algo que no tenga ningún sentido. Es una herramienta para
            inspirarte, no una opinión profesional, y desde luego no es
            asesoramiento médico, psicológico, nutricional ni de ningún otro tipo
            que requiera un especialista.
          </p>
          <p className="mt-3">
            Las decisiones son tuyas, y no respondemos de lo que ocurra por
            seguir una sugerencia suya.
          </p>
        </Destacado>
        <p>
          Puedes consultar en la{" "}
          <Link href="/legal/privacidad" className="underline">
            política de privacidad
          </Link>{" "}
          qué se envía exactamente, a quién y con qué garantías.
        </p>
      </Apartado>

      <Apartado n={7} titulo="Precio">
        <p>
          A día de hoy Dressé es <strong>gratuita</strong>. No hay pagos, ni
          suscripciones, ni datos bancarios de por medio.
        </p>
        <p>
          Si en el futuro añadimos funciones de pago, te lo diremos claramente
          antes: qué cuesta, qué incluye y cómo cancelar. Nunca se te cobrará
          nada sin que lo hayas aceptado expresamente. Como consumidora tendrías
          además catorce días naturales para desistir, en los términos de la ley
          general de defensa de consumidores y usuarios.
        </p>
      </Apartado>

      <Apartado n={8} titulo="Qué podemos y qué no podemos garantizarte">
        <p>
          Ponemos todo de nuestra parte para que Dressé funcione bien y esté
          disponible, pero es un servicio en desarrollo y no podemos prometerte
          que no vaya a fallar nunca, que no se interrumpa o que no aparezcan
          errores.
        </p>
        <p>
          Podemos cambiar, añadir o retirar funciones. Si vamos a retirar algo
          importante o a cerrar el servicio, te avisaremos con antelación
          suficiente para que puedas descargar tus datos desde{" "}
          <strong>Perfil → Ajustes → Descargar mis datos</strong>.
        </p>
        <Destacado>
          <strong>Guarda copia de lo que te importe.</strong> Aunque hacemos
          copias de seguridad, no podemos garantizarte que no se pierda nunca
          nada. Tus fotos originales deberías conservarlas también en tu móvil.
        </Destacado>
      </Apartado>

      <Apartado n={9} titulo="Responsabilidad">
        <p>
          Respondemos de los daños que te causemos por incumplir estas
          condiciones, en los términos que marca la ley. No respondemos, en
          cambio, de lo que publiquen otras usuarias, de lo que hagas tú con la
          aplicación, ni de fallos ajenos a nosotros como una caída de internet o
          de los servicios de terceros de los que dependemos.
        </p>
        <p>
          Nada de lo escrito aquí limita los derechos que la ley te reconoce como
          consumidora, ni nuestra responsabilidad en los casos en que la ley no
          permite limitarla.
        </p>
      </Apartado>

      <Apartado n={10} titulo="Cambios en estas condiciones">
        <p>
          Podemos actualizarlas. Si el cambio te afecta de forma relevante, te lo
          avisaremos dentro de la aplicación antes de que entre en vigor. Si no
          estás de acuerdo, puedes borrar tu cuenta; seguir usando Dressé después
          significa que las aceptas.
        </p>
      </Apartado>

      <Apartado n={11} titulo="Ley aplicable y reclamaciones">
        <p>
          Estas condiciones se rigen por la ley española. Si eres consumidora,
          puedes reclamar ante los juzgados de tu domicilio: la ley te ampara y
          no renuncias a ello por usar Dressé.
        </p>
        <p>
          Antes de llegar ahí, escríbenos a{" "}
          <a href={`mailto:${TITULAR.email}`} className="underline">
            {TITULAR.email}
          </a>
          . Casi todo se arregla hablando.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
