import { Link } from 'react-router-dom'

type AuthSwitchLinkProps = {
  prompt?: string
  label?: string
  to?: string
}

const AuthSwitchLink = ({
  prompt = 'Already have an account?',
  label = 'Log in',
  to = '/login',
}: AuthSwitchLinkProps) => {
  return (
    <p className="text-sm text-center text-slate-600">
      {prompt}{' '}
      <Link
        to={to}
        className="font-semibold text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        {label}
      </Link>
    </p>
  )
}

export default AuthSwitchLink

