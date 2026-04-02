import Home from "../index";

const VALID_SECTIONS = new Set(["people", "relations", "utilities", "accounts", "logs"]);

export async function getServerSideProps({ req, params }) {
  const { getSessionUserId } = require("../../lib/session");
  const userId = await getSessionUserId(req);
  const section = String((params && params.section) || "");

  if (!VALID_SECTIONS.has(section)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      loggedIn: Boolean(userId),
      section,
    },
  };
}

export default Home;
