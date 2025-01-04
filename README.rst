``akalisten``
=============

Python tooling to visualize the results of the participation polls for gigs of AkaBlas for the members as well as other interesting content.
Uses

- the API of the `NextCloud Polls App <https://apps.nextcloud.com/apps/polls>`_ to get the poll results. The API is documented `here <https://github.com/nextcloud/polls/blob/346f37964c53bb6cc132edbb1f113642d2bb2c39/docs/API_v1.0.md>`_.
- the API of the `NextCloud Circles App <https://github.com/nextcloud/circles>`_ to get the members of the circle. Information about the API can be found `here <https://github.com/nextcloud/circles/blob/v30.0.4/appinfo/routes.php>`_. See also `this GitHub thread <https://github.com/nextcloud/circles/issues/1818>`_.
- the API of the `NextCloud Forms App <https://apps.nextcloud.com/apps/forms>`_ to get the results of the forms. The API is documented `here <https://github.com/nextcloud/forms/blob/v4.3.4/docs/API_v3.md>`_.
- the API of `Wordpress <https://wordpress.org/>`_ to publish content to the AkaBlas homepage. The API is documented `here <https://developer.wordpress.org/rest-api/>`_.
- `Jinja2 <https://jinja.palletsprojects.com/>`_ for templating the HTML output.
- `pydanctic <hhttps://docs.pydantic.dev/>`_ models for the data structures.

Installation and Usage
----------------------

- Make sure that you have installed `Python 3.11+ <https://www.python.org/downloads/release/python-3120/>`_ as well as `pip <https://pip.pypa.io/en/stable/installation/>`_.
- Clone the repository and change into the directory::

    git clone https://github.com/AkaBlas/akalisten.git
    cd akalisten

- Install the dependencies. It is recommended to use a virtual environment::

    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt

- Copy the file ``.env.example`` to ``.env`` and adjust the values to your needs::

    cp .env.example .env
    nano .env

- Run the script::

    python main.py

- Open the file ``output/index.html`` in your browser.

Developer Quickstart
--------------------

Make sure to follow the installation steps above.
In addition, please install the ``pre-commit`` hooks::

    pip install pre-commit
    pre-commit install

This makes sure that some sanity checks are run before you commit your changes.
You can also run the checks manually with::

    pre-commit run -a

Now, for a quick overview of the project structure.

.. code-block::

    akalisten
    │   crawl.py  # contains the main logic to retrieve all the data from the APIs
    │   jinja2.py # custom extensions for Jinja2
    │
    ├───clients
    │       # the clients to interact with the APIs
    │
    ├───models
    │   │   # pydantic models to represent the data structures retrieved from the APIs
    │   │   # also contains higher-level abstractions/wrappers around the raw API models that
    │   │   # are used in the Jinja2 templates
    │   │
    │   └───raw_api_models
    │           # the pydantic models representing the raw API responses
    │
    └───template
            # the files used to render the HTML output via Jinja2

