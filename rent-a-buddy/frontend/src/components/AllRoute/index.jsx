import { useRoutes } from "react-router-dom";
import { route } from "../../router/index";

function AllRoutes() {
  const element = useRoutes(route);
  return (
    <>
      {element}
    </>
  )
}

export default AllRoutes