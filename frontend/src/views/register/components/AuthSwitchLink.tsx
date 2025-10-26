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
    <p className="text-sm text-center text-gray-600">
      {prompt}{' '}
      <Link
        to={to}
        className="font-semibold text-brand-primary hover:text-brand-primary/80 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30"
      >
        {label}
      </Link>
    </p>
  )
}

export default AuthSwitchLink

