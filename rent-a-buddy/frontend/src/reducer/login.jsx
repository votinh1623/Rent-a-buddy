//login reducer
const token = localStorage.getItem("token");
const loginReducer = (state = !!token, action) => {
  switch (action.type) {
    case "CHECK_LOGIN":
      return action.status;
    default:
      return state;
  }
}

export default loginReducer;