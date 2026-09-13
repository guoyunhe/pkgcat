import { Redirect, Route, Switch } from 'wouter'

import AppDetailPage from '../pages/AppDetailPage'
import AppFormPage from '../pages/AppFormPage'
import AppsPage from '../pages/AppsPage'
import DistroFormPage from '../pages/DistroFormPage'
import DistrosPage from '../pages/DistrosPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import PkgFormPage from '../pages/PkgFormPage'
import PkgsPage from '../pages/PkgsPage'
import RegisterPage from '../pages/RegisterPage'
import RepoFormPage from '../pages/RepoFormPage'
import ReposPage from '../pages/ReposPage'
import SearchResultsPage from '../pages/SearchResultsPage'
import UserDetailPage from '../pages/UserDetailPage'

/**
 * Page routes of the application. Listing and form pages are grouped by the resource they work on,
 * and the package pages keep redirecting from the `/packages` address they used to have.
 */
export default function AppRoutes() {
  return (
    <Switch>
      <Route path='/login' component={LoginPage} />
      <Route path='/register' component={RegisterPage} />
      <Route path='/search' component={SearchResultsPage} />
      <Route path='/pkgs/new' component={PkgFormPage} />
      <Route path='/pkgs/:id/edit' component={PkgFormPage} />
      <Route path='/pkgs' component={PkgsPage} />
      {/* Package pages used to live under `/packages` and keep redirecting, so old links still work */}
      <Route path='/packages/new'>
        <Redirect replace to='/pkgs/new' />
      </Route>
      <Route path='/packages/:id/edit'>
        {({ id }) => <Redirect replace to={`/pkgs/${id}/edit`} />}
      </Route>
      <Route path='/packages'>
        <Redirect replace to='/pkgs' />
      </Route>
      <Route path='/repos/new' component={RepoFormPage} />
      <Route path='/repos/:id/edit' component={RepoFormPage} />
      <Route path='/repos' component={ReposPage} />
      <Route path='/distros/new' component={DistroFormPage} />
      <Route path='/distros/:id/edit' component={DistroFormPage} />
      <Route path='/distros' component={DistrosPage} />
      <Route path='/users/:id' component={UserDetailPage} />
      <Route path='/apps/new' component={AppFormPage} />
      <Route path='/apps/:id/edit' component={AppFormPage} />
      <Route path='/apps/:id' component={AppDetailPage} />
      <Route path='/apps' component={AppsPage} />
      <Route path='/'>
        <HomePage />
      </Route>
    </Switch>
  )
}
