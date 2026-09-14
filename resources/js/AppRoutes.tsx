import { Suspense, lazy } from 'react'
import { Redirect, Route, Switch } from 'wouter'

import PageLoader from './components/PageLoader'
import AppDetailPage from './pages/AppDetailPage'
import HomePage from './pages/HomePage'
import UserDetailPage from './pages/UserDetailPage'

// Login, registration and the resource forms are not part of the catalog content, so their code is
// split in its own chunk and downloaded only when the visitor opens one of them
const AppFormPage = lazy(() => import('./pages/AppFormPage'))
const DistroFormPage = lazy(() => import('./pages/DistroFormPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const PkgFormPage = lazy(() => import('./pages/PkgFormPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const RepoFormPage = lazy(() => import('./pages/RepoFormPage'))

// The list pages are only opened from the navigation, so each one is split in its own chunk and
// downloaded when the visitor navigates to it
const AppsPage = lazy(() => import('./pages/AppsPage'))
const DistrosPage = lazy(() => import('./pages/DistrosPage'))
const PkgsPage = lazy(() => import('./pages/PkgsPage'))
const ReposPage = lazy(() => import('./pages/ReposPage'))

// The search results are reached from the header search box, so their code is also split out and
// downloaded only when a visitor actually searches for something
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'))

/**
 * Page routes of the application. Listing and form pages are grouped by the resource they work on,
 * and the package pages keep redirecting from the `/packages` address they used to have.
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  )
}
